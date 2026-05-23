import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsOptional,
    IsString,
    IsNumberString,
    IsIn,
    MaxLength,
} from 'class-validator';

export class GetOrderListDto {

    @ApiPropertyOptional({
        example: '1',
        description: 'Page number for pagination (starts from 1)',
    })
    @IsOptional()
    @IsNumberString({}, { message: 'page must be a numeric string' })
    page?: string;

    @ApiPropertyOptional({
        example: '10',
        description: 'Number of records per page (max recommended: 100)',
    })
    @IsOptional()
    @IsNumberString({}, { message: 'limit must be a numeric string' })
    limit?: string;

    @ApiPropertyOptional({
        description: 'Search orders by order ID, customer name, email, or phone',
        example: 'john / #1023 / 093xxxx',
    })
    @IsOptional()
    @IsString({ message: 'search must be a string' })
    @MaxLength(100, { message: 'search must be less than 100 characters' })
    search?: string;

    @ApiPropertyOptional({
        description: 'Filter orders by status (e.g. PENDING, PAID, CANCELLED)',
        example: 'PAID',
    })
    @IsOptional()
    @IsString({ message: 'status must be a string' })
    status?: string;

    @ApiPropertyOptional({
        description: 'Order type (e.g. DINE_IN, TAKEAWAY, DELIVERY)',
        example: 'DINE_IN',
    })
    @IsOptional()
    @IsString({ message: 'type must be a string' })
    type?: string;

    @ApiPropertyOptional({
        example: '2026-01-01',
        description: 'Filter orders from this date (YYYY-MM-DD)',
    })
    @IsOptional()
    @IsString({ message: 'from must be a string date (YYYY-MM-DD)' })
    from?: string;

    @ApiPropertyOptional({
        example: '2026-01-31',
        description: 'Filter orders until this date (YYYY-MM-DD)',
    })
    @IsOptional()
    @IsString({ message: 'to must be a string date (YYYY-MM-DD)' })
    to?: string;

    @ApiPropertyOptional({
        example: 'DESC',
        description: 'Sort order by created_at field',
        enum: ['ASC', 'DESC'],
    })
    @IsOptional()
    @IsIn(['ASC', 'DESC'], {
        message: 'sort must be either ASC or DESC',
    })
    sort?: 'ASC' | 'DESC';
}