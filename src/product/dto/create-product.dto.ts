import {
    IsBoolean,
    IsNumber,
    IsOptional,
    IsString,
    IsArray,
    ValidateNested,
    Min,
    MaxLength,
    MinLength,
    IsPositive,
} from 'class-validator';

import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
class ProductVariantGroupDto {
    @ApiProperty({
        example: 1,
        description: 'ID of existing variant group (SIZE / ICE / SUGAR)',
    })
    @IsNumber({}, { message: 'variant_group_id must be a number' })
    @IsPositive({ message: 'variant_group_id must be greater than 0' })
    variant_group_id: number;

    @ApiPropertyOptional({
        example: true,
        description: 'If true, customer MUST select this option in POS',
        default: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'is_required must be true or false' })
    is_required?: boolean;

    @ApiPropertyOptional({
        example: 1,
        description: 'Display order in POS (smaller number = shown first)',
        default: 0,
    })
    @IsOptional()
    @IsNumber({}, { message: 'sort_order must be a number' })
    @Min(0, { message: 'sort_order cannot be negative' })
    sort_order?: number;
}


export class CreateProductDto {
    @ApiProperty({
        example: 1,
        description: 'Category ID this product belongs to',
    })
    @IsNumber({}, { message: 'category_id must be a number' })
    @IsPositive({ message: 'category_id must be greater than 0' })
    category_id: number;

    @ApiProperty({
        example: 'Iced Latte',
        description: 'Product name shown in POS and menu',
    })
    @IsString({ message: 'name must be a string' })
    @MinLength(2, { message: 'name must be at least 2 characters' })
    @MaxLength(150, { message: 'name must not exceed 150 characters' })
    name: string;

    @ApiProperty({
        example: 'LATTE-001',
        description: 'Unique SKU used for internal tracking',
    })
    @IsString({ message: 'sku must be a string' })
    @MinLength(3, { message: 'sku must be at least 3 characters' })
    sku: string;

    @ApiProperty({
        example: 2.5,
        description: 'Base product price (variant price will adjust this)',
    })
    @IsNumber({}, { message: 'price must be a number' })
    @IsPositive({ message: 'price must be greater than 0' })
    price: number;

    @ApiPropertyOptional({
        example: 'Cold brewed latte with fresh milk',
        description: 'Optional product description',
    })
    @IsOptional()
    @IsString({ message: 'description must be a string' })
    description?: string;

    @ApiProperty({
        description:
            'List of variant groups attached to this product (SIZE, ICE, SUGAR)',
        example: [
            {
                variant_group_id: 1,
                is_required: true,
                sort_order: 1,
            },
        ],
        type: [ProductVariantGroupDto],
    })
    @IsArray({ message: 'variant_groups must be an array' })
    @ValidateNested({ each: true })
    @Type(() => ProductVariantGroupDto)
    variant_groups: ProductVariantGroupDto[];
}