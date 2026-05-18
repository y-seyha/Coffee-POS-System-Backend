import {
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
    Payment,
    PaymentStatus,
} from '../common/entities/payment.entity';

import { PaymentStatusHistory } from '../common/entities/payment_status_history.entity';

import {
    Order,
    OrderStatus,
} from '../common/entities/orders.entity';
import {OrderStatusHistory} from "../common/entities/order_status_history.entity";

@Injectable()
export class PaymentsService {
    private readonly logger = new Logger(PaymentsService.name);

    constructor(
        @InjectRepository(Payment)
        private readonly paymentRepo: Repository<Payment>,

        @InjectRepository(PaymentStatusHistory)
        private readonly historyRepo: Repository<PaymentStatusHistory>,

        @InjectRepository(Order)
        private readonly orderRepo: Repository<Order>,

        @InjectRepository(OrderStatusHistory)
        private readonly orderHistoryRepo: Repository<OrderStatusHistory>,
    ) {}


    private async getPaymentOrFail(id: number) {
        const payment = await this.paymentRepo.findOne({
            where: { id },
            relations: [
                'order',
                'order.items',
                'order.payments',
            ],
        });

        if (!payment) {
            throw new NotFoundException('Payment not found');
        }

        return payment;
    }

    private async addHistory(
        payment: Payment,
        oldStatus: PaymentStatus,
        newStatus: PaymentStatus,
        userId: number,
        notes?: string,
    ) {
        return this.historyRepo.save({
            payment,
            old_status: oldStatus,
            new_status: newStatus,
            notes,
            changed_by: { id: userId },
        });
    }

    async getDashboard() {
        try {
            const totalRevenue = await this.paymentRepo
                .createQueryBuilder('payment')
                .select('COALESCE(SUM(payment.amount), 0)', 'total')
                .where('payment.payment_status = :status', {
                    status: PaymentStatus.PAID,
                })
                .getRawOne();

            const todayPayments = await this.paymentRepo
                .createQueryBuilder('payment')
                .select('COUNT(*)', 'count')
                .where('DATE(payment.created_at) = CURRENT_DATE')
                .getRawOne();

            const failedPayments = await this.paymentRepo.count({
                where: {
                    payment_status: PaymentStatus.FAILED,
                },
            });

            const refundedPayments = await this.paymentRepo.count({
                where: {
                    payment_status: PaymentStatus.REFUNDED,
                },
            });

            const paymentMethods = await this.paymentRepo
                .createQueryBuilder('payment')
                .select('payment.payment_method', 'method')
                .addSelect('COUNT(*)', 'count')
                .groupBy('payment.payment_method')
                .getRawMany();

            const latestTransactions = await this.paymentRepo.find({
                relations: ['order'],
                order: {
                    created_at: 'DESC',
                },
                take: 10,
            });

            return {
                revenue: totalRevenue.total,
                today_payments: todayPayments.count,
                failed_payments: failedPayments,
                refunded_payments: refundedPayments,
                payment_methods: paymentMethods,
                latest_transactions: latestTransactions,
            };
        } catch (error) {
            this.logger.error(error.stack);

            throw new InternalServerErrorException(
                'Failed to fetch dashboard',
            );
        }
    }


    async getPayments(query: any) {
        try {
            const page = Number(query.page || 1);
            const limit = Number(query.limit || 10);

            const qb = this.paymentRepo
                .createQueryBuilder('payment')
                .leftJoinAndSelect('payment.order', 'order');

            if (query.status) {
                qb.andWhere(
                    'payment.payment_status = :status',
                    {
                        status: query.status,
                    },
                );
            }

            if (query.method) {
                qb.andWhere(
                    'payment.payment_method = :method',
                    {
                        method: query.method,
                    },
                );
            }

            if (query.transaction_id) {
                qb.andWhere(
                    'payment.transaction_id ILIKE :trx',
                    {
                        trx: `%${query.transaction_id}%`,
                    },
                );
            }

            if (query.order_number) {
                qb.andWhere(
                    'order.order_number ILIKE :orderNumber',
                    {
                        orderNumber: `%${query.order_number}%`,
                    },
                );
            }

            if (query.from && query.to) {
                qb.andWhere(
                    'payment.created_at BETWEEN :from AND :to',
                    {
                        from: query.from,
                        to: query.to,
                    },
                );
            }

            const [data, total] = await qb
                .orderBy('payment.created_at', 'DESC')
                .skip((page - 1) * limit)
                .take(limit)
                .getManyAndCount();

            return {
                data,
                total,
                page,
                limit,
            };
        } catch (error) {
            this.logger.error(error.stack);

            throw new InternalServerErrorException(
                'Failed to fetch payments',
            );
        }
    }


    async getPaymentById(id: number) {
        try {
            return await this.paymentRepo.findOne({
                where: { id },
                relations: [
                    'order',
                    'order.items',
                ],
            });
        } catch (error) {
            this.logger.error(error.stack);

            throw new InternalServerErrorException(
                'Failed to fetch payment',
            );
        }
    }

    async markAsPaid(
        paymentId: number,
        userId: number,
        transactionId?: string,
    ) {
        try {
            const payment = await this.getPaymentOrFail(
                paymentId,
            );

            if (
                payment.payment_status === PaymentStatus.PAID
            ) {
                throw new BadRequestException(
                    'Payment already paid',
                );
            }

            const oldStatus = payment.payment_status;

            payment.payment_status = PaymentStatus.PAID;
            payment.paid_at = new Date();

            if (transactionId) {
                payment.transaction_id = transactionId;
            }

            await this.paymentRepo.save(payment);

            await this.addHistory(
                payment,
                oldStatus,
                PaymentStatus.PAID,
                userId,
                'Payment marked as paid',
            );

            return {
                message: 'Payment marked as paid',
            };
        } catch (error) {
            this.logger.error(error.stack);

            if (error instanceof BadRequestException) {
                throw error;
            }

            throw new InternalServerErrorException(
                'Failed to mark payment as paid',
            );
        }
    }

    async markAsFailed(
        paymentId: number,
        userId: number,
        reason?: string,
    ) {
        try {
            const payment = await this.getPaymentOrFail(
                paymentId,
            );

            const oldStatus = payment.payment_status;

            payment.payment_status = PaymentStatus.FAILED;

            await this.paymentRepo.save(payment);

            await this.addHistory(
                payment,
                oldStatus,
                PaymentStatus.FAILED,
                userId,
                reason || 'Payment failed',
            );

            return {
                message: 'Payment marked as failed',
            };
        } catch (error) {
            this.logger.error(error.stack);

            throw new InternalServerErrorException(
                'Failed to mark payment as failed',
            );
        }
    }

    async refundPayment(
        paymentId: number,
        userId: number,
        reason?: string,
    ) {
        try {
            const payment = await this.getPaymentOrFail(paymentId);

            const status = payment.payment_status as PaymentStatus;

            // already refunded
            if (status === PaymentStatus.REFUNDED) {
                throw new BadRequestException('Already refunded');
            }

            //  not refundable
            if (status !== PaymentStatus.PAID) {
                throw new BadRequestException(
                    'Only PAID payments can be refunded',
                );
            }

            const oldStatus = status;

            payment.payment_status = PaymentStatus.REFUNDED;

            await this.paymentRepo.save(payment);

            await this.addHistory(
                payment,
                oldStatus,
                PaymentStatus.REFUNDED,
                userId,
                reason ?? 'Payment refunded',
            );

            if (payment.order) {
                const oldOrderStatus = payment.order.order_status;

                payment.order.order_status = OrderStatus.CANCELLED;
                payment.order.cancelled_at = new Date();

                await this.orderRepo.save(payment.order);

                await this.addOrderHistory(
                    payment.order,
                    oldOrderStatus,
                    OrderStatus.CANCELLED,
                    userId,
                    reason ?? 'Refund triggered order cancel',
                );
            }

            return {
                message: 'Payment refunded successfully',
            };
        } catch (error) {
            this.logger.error(error);

            if (error instanceof BadRequestException) {
                throw error;
            }

            throw new InternalServerErrorException(
                'Failed refund payment',
            );
        }
    }
    private async addOrderHistory(
        order: Order,
        oldStatus: OrderStatus,
        newStatus: OrderStatus,
        userId: number,
        notes?: string,
    ) {
        return this.orderHistoryRepo.save({
            order,
            status: newStatus,
            notes,
            user: { id: userId },
        });
    }
}