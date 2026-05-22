import {
    IsBoolean,
    IsNumber,
    IsOptional,
    IsPositive,
    Min,
} from "class-validator";

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class AttachSingleVariantGroupDto {

    @ApiProperty({
        example: 1,
        description: "ID of the variant group to attach to the product",
        minimum: 1,
    })
    @IsNumber()
    @IsPositive()
    variant_group_id: number;

    @ApiPropertyOptional({
        example: true,
        description:
            "Whether this variant group is required when selecting a product (default: true)",
        default: true,
    })
    @IsOptional()
    @IsBoolean()
    is_required?: boolean;

    @ApiPropertyOptional({
        example: 0,
        description:
            "Sort order of the variant group inside the product (lower = shown first)",
        minimum: 0,
        default: 0,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    sort_order?: number;
}