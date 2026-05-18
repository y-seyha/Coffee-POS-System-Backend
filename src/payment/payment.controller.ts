import {
    Controller,
    Get,
    Patch,
    Param,
    Query,
    Body,
    UseGuards,
    ParseIntPipe,
} from '@nestjs/common';

import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiTags,
} from '@nestjs/swagger';


import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RoleGuard } from '../auth/guard/role.guard';

import { Roles } from '../auth/decorator/roles.decorator';
import { CurrentUser } from '../auth/decorator/current_user.decorator';

import { RefundPaymentDto } from './dto/refund-payment.dto';
import {PaymentsService} from "./payment.service";
import {FilterPaymentsDto} from "./dto/filter-payments.dto";
import {MarkPaidDto} from "./dto/mark-paid.dto";
import {MarkFailedDto} from "./dto/mark-failed.dto";

@ApiTags('Payments')
@ApiBearerAuth()
@Controller('payments')
@UseGuards(JwtAuthGuard, RoleGuard)
export class PaymentsController {
    constructor(
        private readonly paymentsService: PaymentsService,
    ) {}

    //Done
    @Get('dashboard')
    @Roles('ADMIN', 'MANAGER')
    @ApiOperation({
        summary: 'Get payment dashboard',
    })
    getDashboard() {
        return this.paymentsService.getDashboard();
    }


    //Done
    @Get()
    @Roles('ADMIN', 'MANAGER')
    @ApiOperation({
        summary: 'Get all payments',
    })
    getPayments(
        @Query() query: FilterPaymentsDto,
    ) {
        return this.paymentsService.getPayments(query);
    }

    //Done
    @Get(':id')
    @Roles('ADMIN', 'MANAGER')
    @ApiOperation({
        summary: 'Get payment by id',
    })
    @ApiParam({
        name: 'id',
        type: Number,
        example: 1,
    })
    getPaymentById(
        @Param('id', ParseIntPipe)
        id: number,
    ) {
        return this.paymentsService.getPaymentById(
            id,
        );
    }

    //Done
    @Patch(':id/paid')
    @Roles('ADMIN', 'MANAGER')
    @ApiOperation({
        summary: 'Mark payment as paid',
    })
    @ApiParam({
        name: 'id',
        type: Number,
        example: 1,
    })
    markAsPaid(
        @Param('id', ParseIntPipe)
        id: number,

        @Body()
        dto: MarkPaidDto,

        @CurrentUser('id')
        userId: number,
    ) {
        return this.paymentsService.markAsPaid(
            id,
            userId,
            dto.transaction_id,
        );
    }

    //Done
    @Patch(':id/failed')
    @Roles('ADMIN', 'MANAGER')
    @ApiOperation({
        summary: 'Mark payment as failed',
    })
    @ApiParam({
        name: 'id',
        type: Number,
        example: 1,
    })
    markAsFailed(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: MarkFailedDto,
        @CurrentUser('id') userId: number,
    ) {
        {
            return this.paymentsService.markAsFailed(
                id,
                userId,
                dto.remarks,
            );
        }
    }

    //Done
    @Patch(':id/refund')
    @Roles('ADMIN')
    @ApiOperation({
        summary: 'Refund payment',
    })
    @ApiParam({
        name: 'id',
        type: Number,
        example: 1,
    })
    refundPayment(
        @Param('id', ParseIntPipe)
        id: number,

        @Body()
        dto: RefundPaymentDto,

        @CurrentUser('id')
        userId: number,
    ) {
        return this.paymentsService.refundPayment(
            id,
            userId,
            dto.reason,
        );
    }
}