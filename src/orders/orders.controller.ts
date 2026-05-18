import {
    Controller,
    Get,
    Param,
    Query,
    Patch,
    ParseIntPipe,
    UseGuards,
    Body,
} from '@nestjs/common';

import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RoleGuard } from '../auth/guard/role.guard';

import { OrdersService } from './orders.service';

import { FilterOrdersDto } from './dto/filter-orders.dto';
import { OrderReportDto } from './dto/order-report.dto';
import { OrderIdDto } from './dto/order-id.dto';
import { ConfirmOrderDto } from './dto/confirm-order.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { CompleteOrderDto } from './dto/complete-order.dto';

import { Roles } from '../auth/decorator/roles.decorator';
import { CurrentUser } from '../auth/decorator/current_user.decorator';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard, RoleGuard)
export class OrdersController {
    constructor(private readonly orderService: OrdersService) {}

    @Get('report')
    @Roles('ADMIN', 'MANAGER')
    @ApiOperation({
        summary: 'Get order analytics report',
        description:
            'Returns summary, sales analytics, top products, and status statistics',
    })
    @ApiResponse({
        status: 200,
        description: 'Report generated successfully',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
    })
    @ApiResponse({
        status: 403,
        description: 'Forbidden',
    })
    getReport(@Query() dto: OrderReportDto) {
        return this.orderService.getReport(dto);
    }


    @Get('stats/status')
    @Roles('ADMIN')
    @ApiOperation({
        summary: 'Get order status statistics',
    })
    @ApiResponse({
        status: 200,
        description: 'Order status stats fetched successfully',
    })
    getOrderStatusStats() {
        return this.orderService.getOrderStatusStats();
    }

    @Get('stats/daily-sales')
    @Roles('ADMIN')
    @ApiOperation({
        summary: 'Get daily sales total',
    })
    @ApiQuery({
        name: 'date',
        required: true,
        example: '2026-05-18',
        description: 'Date in YYYY-MM-DD format',
    })
    @ApiResponse({
        status: 200,
        description: 'Daily sales fetched successfully',
    })
    getDailySales(@Query('date') date: string) {
        return this.orderService.getDailySales(date);
    }

    @Get('stats/monthly-revenue')
    @Roles('ADMIN')
    @ApiOperation({
        summary: 'Get monthly revenue',
    })
    @ApiQuery({
        name: 'month',
        required: true,
        example: 5,
    })
    @ApiQuery({
        name: 'year',
        required: true,
        example: 2026,
    })
    @ApiResponse({
        status: 200,
        description: 'Monthly revenue fetched successfully',
    })
    getMonthlyRevenue(
        @Query('month') month: number,
        @Query('year') year: number,
    ) {
        return this.orderService.getMonthlyRevenue(month, year);
    }

    @Get('stats/top-products')
    @Roles('ADMIN')
    @ApiOperation({
        summary: 'Get top selling products',
    })
    @ApiQuery({
        name: 'limit',
        required: false,
        example: 10,
        description: 'Number of top products to return',
    })
    @ApiResponse({
        status: 200,
        description: 'Top products fetched successfully',
    })
    getTopProducts(@Query('limit') limit: number) {
        return this.orderService.getTopProducts(limit);
    }


    @Get()
    @ApiOperation({
        summary: 'Get all orders',
    })
    @ApiResponse({
        status: 200,
        description: 'Orders fetched successfully',
    })
    getOrders(@Query() query: FilterOrdersDto) {
        return this.orderService.getOrders(query);
    }

    @Get(':id')
    @ApiOperation({
        summary: 'Get order by ID',
    })
    @ApiParam({
        name: 'id',
        type: Number,
        example: 1,
        description: 'Order ID',
    })
    @ApiResponse({
        status: 200,
        description: 'Order fetched successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Order not found',
    })
    getOrderById(@Param('id', ParseIntPipe) id: number) {
        return this.orderService.getOrderById(id);
    }


    @Patch(':id/confirm')
    @Roles('ADMIN')
    @ApiOperation({
        summary: 'Confirm order',
    })
    @ApiParam({
        name: 'id',
        type: Number,
        example: 1,
    })
    @ApiResponse({
        status: 200,
        description: 'Order confirmed successfully',
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid order status',
    })
    confirmOrder(
        @Param() params: OrderIdDto,
        @Body() dto: ConfirmOrderDto,
        @CurrentUser('id') userId: number,
    ) {
        return this.orderService.confirmOrder(params.id, userId, dto);
    }

    @Patch(':id/cancel')
    @Roles('ADMIN')
    @ApiOperation({
        summary: 'Cancel order',
    })
    @ApiParam({
        name: 'id',
        type: Number,
        example: 1,
    })
    @ApiResponse({
        status: 200,
        description: 'Order cancelled successfully',
    })
    @ApiResponse({
        status: 400,
        description: 'Order cannot be cancelled',
    })
    cancelOrder(
        @Param() params: OrderIdDto,
        @Body() dto: CancelOrderDto,
        @CurrentUser('id') userId: number,
    ) {
        return this.orderService.cancelOrder(params.id, userId, dto);
    }

    @Patch(':id/complete')
    @Roles('ADMIN')
    @ApiOperation({
        summary: 'Complete order',
    })
    @ApiParam({
        name: 'id',
        type: Number,
        example: 1,
    })
    @ApiResponse({
        status: 200,
        description: 'Order completed successfully',
    })
    @ApiResponse({
        status: 400,
        description: 'Only confirmed orders can be completed',
    })
    completeOrder(
        @Param() params: OrderIdDto,
        @Body() dto: CompleteOrderDto,
        @CurrentUser('id') userId: number,
    ) {
        return this.orderService.completeOrder(params.id, userId, dto);
    }
}