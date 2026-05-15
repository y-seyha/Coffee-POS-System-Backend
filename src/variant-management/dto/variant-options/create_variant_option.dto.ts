import {
    IsBoolean,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PriceAdjustmentType } from '../../../common/entities/variant_options.entity';

export class CreateVariantOptionDto {
    @ApiProperty({
        example: 1,
        description: 'ID of the variant group this option belongs to',
    })
    @IsNumber({}, { message: 'variant_group_id must be a number' })
    @IsNotEmpty({ message: 'variant_group_id is required' })
    variant_group_id: number;

    @ApiProperty({
        example: 'Large',
        description: 'Display name of the variant option',
    })
    @IsString({ message: 'name must be a string' })
    @IsNotEmpty({ message: 'name is required' })
    name: string;

    @ApiPropertyOptional({
        enum: PriceAdjustmentType,
        example: PriceAdjustmentType.ADD,
        description:
            'Defines how price adjustment is applied (ADD, SET, PERCENT)',
    })
    @IsOptional()
    @IsEnum(PriceAdjustmentType, {
        message: 'Invalid price_adjustment_type',
    })
    price_adjustment_type?: PriceAdjustmentType;

    @ApiPropertyOptional({
        example: 1,
        description: 'Price adjustment value (depends on adjustment type)',
    })
    @IsOptional()
    @IsNumber({}, { message: 'price_adjustment must be a number' })
    @Min(0, { message: 'price_adjustment cannot be negative' })
    price_adjustment?: number;

    @ApiPropertyOptional({
        example: false,
        description: 'Mark this option as default selection for its group',
    })
    @IsOptional()
    @IsBoolean({ message: 'is_default must be a boolean' })
    is_default?: boolean;

    @ApiPropertyOptional({
        example: true,
        description: 'Enable or disable this variant option',
        default: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'is_active must be a boolean' })
    is_active?: boolean;
}