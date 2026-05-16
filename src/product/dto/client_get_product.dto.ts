import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsOptional,
    IsString,
    IsEnum,
    IsNumber,
    Min,
} from 'class-validator';

export enum ProductSort {
    DEFAULT = 'default',
    PRICE_ASC = 'price_asc',
    PRICE_DESC = 'price_desc',
    NEWEST = 'newest',
    NAME_ASC = 'name_asc',
}

export class ClientGetProductsQueryDto {
    @ApiPropertyOptional({
        example: 1,
        description: 'Page number',
        default: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page: number = 1;

    @ApiPropertyOptional({
        example: 10,
        description: 'Items per page',
        default: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    limit: number = 10;

    @ApiPropertyOptional({
        example: 'iphone',
        description: 'Search by product name or SKU',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        example: 2,
        description: 'Filter by category ID',
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    categoryId?: number;

    @ApiPropertyOptional({
        enum: ProductSort,
        example: ProductSort.DEFAULT,
        description: 'Sort products',
        default: ProductSort.DEFAULT,
    })
    @IsOptional()
    @IsEnum(ProductSort)
    sort: ProductSort = ProductSort.DEFAULT;
}