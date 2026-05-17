import { PartialType } from '@nestjs/mapped-types';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';
import { DiscountType } from '../../common/entities/discount.entity';
import { CreateDiscountDto } from './create-discount.dto';

export class UpdateDiscountDto extends PartialType(CreateDiscountDto) {
    @ApiPropertyOptional({
        example: 'Updated Discount Name',
    })
    @IsOptional()
    @IsString({ message: 'Name must be a string' })
    name?: string;

    @ApiPropertyOptional({
        enum: DiscountType,
    })
    @IsOptional()
    @IsEnum(DiscountType)
    type?: DiscountType;

    @ApiPropertyOptional({
        example: 15,
        minimum: 0,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { message: 'Value must be a number' })
    @Min(0)
    value?: number;
}