import {
    IsOptional,
    IsEnum,
    IsString,
    IsDateString,
    IsNumber,
} from 'class-validator';

import { Type } from 'class-transformer';
import {
    PaymentMethod,
    PaymentStatus,
} from '../../common/entities/payment.entity';

import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterPaymentsDto {

    @ApiPropertyOptional({
        enum: PaymentStatus,
        example: PaymentStatus.PAID,
    })
    @IsOptional()
    @IsEnum(PaymentStatus)
    status?: PaymentStatus;

    @ApiPropertyOptional({
        enum: PaymentMethod,
        example: PaymentMethod.KHQR,
    })
    @IsOptional()
    @IsEnum(PaymentMethod)
    method?: PaymentMethod;

    @ApiPropertyOptional({
        example: 'TRX123456',
    })
    @IsOptional()
    @IsString()
    transaction_id?: string;

    @ApiPropertyOptional({
        example: 'ORD-1001',
    })
    @IsOptional()
    @IsString()
    order_number?: string;

    @ApiPropertyOptional({
        example: '2026-05-01',
    })
    @IsOptional()
    @IsDateString()
    from?: string;

    @ApiPropertyOptional({
        example: '2026-05-31',
    })
    @IsOptional()
    @IsDateString()
    to?: string;

    @ApiPropertyOptional({
        example: 1,
        default: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    page: number = 1;

    @ApiPropertyOptional({
        example: 10,
        default: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    limit: number = 10;
}