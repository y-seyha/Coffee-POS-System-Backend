import {
    Injectable,
    BadRequestException,
    NotFoundException,
    Logger,
    InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Order, OrderStatus } from '../common/entities/orders.entity';
import { OrderStatusHistory } from '../common/entities/order_status_history.entity';

import { FilterOrdersDto } from './dto/filter-orders.dto';
import { OrderReportDto } from './dto/order-report.dto';
import { ConfirmOrderDto } from './dto/confirm-order.dto';
import { CompleteOrderDto } from './dto/complete-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import {Payment, PaymentStatus} from "../common/entities/payment.entity";

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name);

    constructor(
        @InjectRepository(Order)
        private readonly orderRepo: Repository<Order>,

        @InjectRepository(OrderStatusHistory)
        private readonly historyRepo: Repository<OrderStatusHistory>,


        @InjectRepository(Payment)
        private readonly paymentRepo: Repository<Payment>,
    ) {}


    private async addHistory(
        order: Order,
        status: OrderStatus,
        userId: number,
        notes?: string,
    ) {
        return this.historyRepo.save({
            order,
            status,
            notes,
            user: { id: userId },
        });
    }

    private async getOrderOrFail(id: number) {
        const order = await this.orderRepo.findOne({
            where: { id },
            relations: ['items', 'items.variants', 'payments', 'status_history'],
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return order;
    }

    private assertCanChangeStatus(
        current: OrderStatus,
        allowed: OrderStatus[],
    ) {
        if (!allowed.includes(current)) {
            throw new BadRequestException(
                `Invalid status transition from ${current}`,
            );
        }
    }

    async getOrderById(id: number) {
        this.logger.log(`Fetching order id=${id}`);

        try {
            return await this.getOrderOrFail(id);
        } catch (error) {
            this.logger.error(error.message, error.stack);
            throw new InternalServerErrorException('Failed to fetch order');
        }
    }

    async getOrders(query: FilterOrdersDto) {
        this.logger.log('Fetching orders list');

        try {
            const page = Number(query.page || 1);
            const limit = Number(query.limit || 10);
            const skip = (page - 1) * limit;

            const qb = this.orderRepo
                .createQueryBuilder('order')
                .leftJoinAndSelect('order.items', 'items')
                .leftJoinAndSelect('order.payments', 'payments');

            if (query.status) {
                qb.andWhere('order.order_status = :status', {
                    status: query.status,
                });
            }

            if (query.type) {
                qb.andWhere('order.order_type = :type', {
                    type: query.type,
                });
            }

            if (query.from && query.to) {
                qb.andWhere('order.created_at BETWEEN :from AND :to', {
                    from: query.from,
                    to: query.to,
                });
            }

            const [data, total] = await qb
                .skip(skip)
                .take(limit)
                .orderBy('order.created_at', 'DESC')
                .getManyAndCount();

            return { data, total, page, limit };
        } catch (error) {
            this.logger.error(error.stack);
            throw new InternalServerErrorException('Failed to fetch orders');
        }
    }

    async confirmOrder(
        orderId: number,
        userId: number,
        dto: ConfirmOrderDto,
    ) {
        this.logger.log(`Confirm order id=${orderId}`);

        try {
            const order = await this.getOrderOrFail(orderId);

            this.assertCanChangeStatus(order.order_status, [
                OrderStatus.PENDING,
            ]);

            order.order_status = OrderStatus.CONFIRMED;
            await this.orderRepo.save(order);

            await this.addHistory(
                order,
                OrderStatus.CONFIRMED,
                userId,
                dto.note || 'Order confirmed',
            );

            return { message: 'Order confirmed' };
        } catch (error) {
            this.logger.error(error.stack);

            if (error instanceof BadRequestException) throw error;

            throw new InternalServerErrorException('Failed to confirm order');
        }
    }

    async cancelOrder(orderId: number, userId: number, dto: CancelOrderDto) {
        this.logger.log(`Cancel order id=${orderId}`);

        try {
            const order = await this.getOrderOrFail(orderId);

            if (order.order_status === OrderStatus.COMPLETED) {
                throw new BadRequestException(
                    'Completed order cannot be cancelled',
                );
            }

            if (order.order_status === OrderStatus.CANCELLED) {
                throw new BadRequestException('Order already cancelled');
            }

            order.order_status = OrderStatus.CANCELLED;
            order.cancelled_at = new Date();
            await this.orderRepo.save(order);

            await this.paymentRepo.update(
                { order: { id: orderId } },
                {
                    payment_status: PaymentStatus.FAILED,
                    remarks: dto.reason || 'Order cancelled',
                },
            );

            await this.addHistory(
                order,
                OrderStatus.CANCELLED,
                userId,
                dto.reason || 'Order cancelled',
            );

            return { message: 'Order cancelled' };
        } catch (error) {
            this.logger.error(error.stack);

            if (error instanceof BadRequestException) throw error;

            throw new InternalServerErrorException('Failed to cancel order');
        }
    }

    async completeOrder(
        orderId: number,
        userId: number,
        dto: CompleteOrderDto,
    ) {
        this.logger.log(`Complete order id=${orderId}`);

        try {
            const order = await this.getOrderOrFail(orderId);

            this.assertCanChangeStatus(order.order_status, [
                OrderStatus.CONFIRMED,
            ]);

            order.order_status = OrderStatus.COMPLETED;
            await this.orderRepo.save(order);

            await this.addHistory(
                order,
                OrderStatus.COMPLETED,
                userId,
                dto.note || 'Order completed',
            );

            return { message: 'Order completed' };
        } catch (error) {
            this.logger.error(error.stack);

            if (error instanceof BadRequestException) throw error;

            throw new InternalServerErrorException('Failed to complete order');
        }
    }


    async getOrderStatusStats() {
        try {
            return await this.orderRepo
                .createQueryBuilder('order')
                .select('order.order_status', 'status')
                .addSelect('COUNT(*)', 'count')
                .groupBy('order.order_status')
                .getRawMany();
        } catch (error) {
            throw new InternalServerErrorException('Failed stats');
        }
    }

    async getDailySales(date: string) {
        try {
            return await this.orderRepo
                .createQueryBuilder('order')
                .select('COALESCE(SUM(order.grand_total), 0)', 'total')
                .where('DATE(order.created_at) = :date', { date })
                .andWhere('order.order_status != :cancelled', {
                    cancelled: OrderStatus.CANCELLED,
                })
                .getRawOne();
        } catch (error) {
            throw new InternalServerErrorException('Failed daily sales');
        }
    }

    async getMonthlyRevenue(month: number, year: number) {
        try {
            return await this.orderRepo
                .createQueryBuilder('order')
                .select('COALESCE(SUM(order.grand_total), 0)', 'total')
                .where('EXTRACT(MONTH FROM order.created_at) = :month', {
                    month,
                })
                .andWhere('EXTRACT(YEAR FROM order.created_at) = :year', {
                    year,
                })
                .andWhere('order.order_status = :status', {
                    status: OrderStatus.COMPLETED,
                })
                .getRawOne();
        } catch (error) {
            throw new InternalServerErrorException('Failed monthly revenue');
        }
    }

    async getTopProducts(limit = 10) {
        try {
            return await this.orderRepo
                .createQueryBuilder('order')
                .innerJoin('order.items', 'item')
                .select('item.product_id', 'product_id')
                .addSelect('item.name', 'name')
                .addSelect('SUM(item.quantity)', 'total_sold')
                .where('order.order_status != :status', {
                    status: OrderStatus.CANCELLED,
                })
                .groupBy('item.product_id')
                .addGroupBy('item.name')
                .orderBy('total_sold', 'DESC')
                .limit(limit)
                .getRawMany();
        } catch (error) {
            throw new InternalServerErrorException('Failed top products');
        }
    }

    async getReport(dto: OrderReportDto) {
        try {
            const limit = dto.limit || 10;

            const statusStats = await this.getOrderStatusStats();

            const dailySales = await this.getDailySales(
                new Date().toISOString().split('T')[0],
            );

            const now = new Date();
            const monthlyRevenue = await this.getMonthlyRevenue(
                now.getMonth() + 1,
                now.getFullYear(),
            );

            const topProducts = await this.getTopProducts(limit);

            const totalOrders = await this.orderRepo.count();
            const completedOrders = await this.orderRepo.count({
                where: { order_status: OrderStatus.COMPLETED },
            });
            const pendingOrders = await this.orderRepo.count({
                where: { order_status: OrderStatus.PENDING },
            });

            return {
                summary: {
                    total_orders: totalOrders,
                    completed_orders: completedOrders,
                    pending_orders: pendingOrders,
                },
                sales: {
                    daily: dailySales.total,
                    monthly: monthlyRevenue.total,
                },
                top_products: topProducts,
                status_stats: statusStats,
            };
        } catch (error) {
            throw new InternalServerErrorException('Failed report generation');
        }
    }
}