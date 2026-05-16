import { ApiProperty } from '@nestjs/swagger';
import {
    IsArray,
    ValidateNested,
    IsNumber,
    IsBoolean,
    IsOptional,
    Min,
    IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';

class VariantGroupItemDto {
    @ApiProperty({
        example: 1,
        description: 'Variant group ID (e.g. SIZE, ICE, SUGAR)',
    })
    @IsNumber()
    @IsPositive()
    variant_group_id: number;

    @ApiProperty({
        example: true,
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    is_required?: boolean;

    @ApiProperty({
        example: 1,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    sort_order?: number;
}

export class AttachProductVariantGroupsDto {
    @ApiProperty({
        type: [VariantGroupItemDto],
        description: 'List of variant groups to attach to product',
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => VariantGroupItemDto)
    variant_groups: VariantGroupItemDto[];
}