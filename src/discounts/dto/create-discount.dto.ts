import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsString,
    Min,
} from 'class-validator';
import { DiscountType } from '../../common/entities/discount.entity';

export class CreateDiscountDto {
    @ApiProperty({
        example: 'Black Friday Discount',
        description: 'Name of the discount',
    })
    @IsString({ message: 'Name must be a string' })
    @IsNotEmpty({ message: 'Name is required' })
    name: string;

    @ApiProperty({
        enum: DiscountType,
        example: DiscountType.PERCENTAGE,
        description: 'Type of discount (percentage or fixed)',
    })
    @IsEnum(DiscountType, {
        message: `Type must be one of: ${Object.values(DiscountType).join(', ')}`,
    })
    type: DiscountType;

    @ApiProperty({
        example: 10,
        description: 'Discount value (percentage or fixed amount)',
        minimum: 0,
    })
    @Type(() => Number)
    @IsNumber({}, { message: 'Value must be a number' })
    @Min(0, { message: 'Value must be greater than or equal to 0' })
    value: number;
}