import {
    IsOptional,
    IsEnum,
    IsDateString,
    IsInt,
    Min,
    Max,
} from 'class-validator';

import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

import {
    OrderStatus,
    OrderType,
} from '../../common/entities/orders.entity';

export class FilterOrdersDto {
    @ApiPropertyOptional({
        enum: OrderStatus,
        description: 'Filter by order status',
        example: OrderStatus.PENDING,
    })
    @IsOptional()
    @IsEnum(OrderStatus, {
        message: 'Invalid order status',
    })
    status?: OrderStatus;

    @ApiPropertyOptional({
        enum: OrderType,
        description: 'Filter by order type',
        example: OrderType.DINEIN,
    })
    @IsOptional()
    @IsEnum(OrderType, {
        message: 'Invalid order type',
    })
    type?: OrderType;

    @ApiPropertyOptional({
        example: '2026-05-01',
        description: 'Start date filter',
    })
    @IsOptional()
    @IsDateString({}, {
        message: 'from must be a valid ISO date',
    })
    from?: string;

    @ApiPropertyOptional({
        example: '2026-05-31',
        description: 'End date filter',
    })
    @IsOptional()
    @IsDateString({}, {
        message: 'to must be a valid ISO date',
    })
    to?: string;

    @ApiPropertyOptional({
        example: 1,
        description: 'Page number',
        default: 1,
        minimum: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({
        message: 'page must be an integer',
    })
    @Min(1, {
        message: 'page must be at least 1',
    })
    page: number = 1;

    @ApiPropertyOptional({
        example: 10,
        description: 'Items per page',
        default: 10,
        minimum: 1,
        maximum: 100,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({
        message: 'limit must be an integer',
    })
    @Min(1, {
        message: 'limit must be at least 1',
    })
    @Max(100, {
        message: 'limit cannot exceed 100',
    })
    limit: number = 10;
}