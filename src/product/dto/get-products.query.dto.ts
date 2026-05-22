import {
    IsOptional,
    IsString,
    IsNumber,
    Min,
    IsIn,
} from 'class-validator';

import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetProductsQueryDto {
    @ApiPropertyOptional({
        example: 1,
        description: 'Page number for pagination (starts from 1)',
        minimum: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'page must be a number' })
    @Min(1, { message: 'page must be at least 1' })
    page: number = 1;

    @ApiPropertyOptional({
        example: 10,
        description: 'Number of items per page',
        minimum: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'limit must be a number' })
    @Min(1, { message: 'limit must be at least 1' })
    limit: number = 10;

    @ApiPropertyOptional({
        example: 'latte',
        description: 'Search by product name or SKU (case-insensitive)',
    })
    @IsOptional()
    @IsString({ message: 'search must be a string' })
    search?: string;

    @ApiPropertyOptional({
        example: 'name',
        description: 'Field used for sorting results',
        enum: ['id', 'name', 'price', 'created_at'],
    })
    @IsOptional()
    @IsIn(['id', 'name', 'price', 'created_at'], {
        message: 'sortBy must be one of: id, name, price, created_at',
    })
    sortBy: string = 'id';

    @ApiPropertyOptional({
        example: 'DESC',
        description: 'Sort order (ascending or descending)',
        enum: ['ASC', 'DESC'],
    })
    @IsOptional()
    @IsIn(['ASC', 'DESC'], {
        message: 'sortOrder must be either ASC or DESC',
    })
    sortOrder: 'ASC' | 'DESC' = 'DESC';

    @ApiPropertyOptional({
        example: 1,
        description: 'Filter products by categories ID',
        minimum: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'categoryId must be a number' })
    @Min(1, { message: 'categoryId must be greater than 0' })
    categoryId?: number;
}