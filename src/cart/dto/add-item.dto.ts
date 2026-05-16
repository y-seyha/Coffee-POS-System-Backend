import { Type } from 'class-transformer';
import {
    IsInt,
    Min,
    IsPositive,
    IsOptional,
    ValidateNested,
    IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class AddItemVariantDto {
    @ApiProperty()
    @IsInt()
    variant_group_id: number;

    @ApiProperty()
    @IsInt()
    variant_option_id: number;
}

export class AddItemDto {
    @ApiProperty({
        example: 1,
    })
    @Type(() => Number)
    @IsInt()
    @IsPositive()
    product_id: number;

    @ApiProperty({
        example: 1,
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    quantity: number;

    @ApiProperty({
        type: [AddItemVariantDto],
        required: false,
    })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AddItemVariantDto)
    variants?: AddItemVariantDto[];
}