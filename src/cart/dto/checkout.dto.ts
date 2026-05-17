import {
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { OrderType } from '../../common/entities/orders.entity';

import { PaymentMethod } from '../../common/entities/payment.entity';

export class CheckoutDto {

    @ApiProperty({
        enum: OrderType,
        example: OrderType.TAKEAWAY,
        description:
            'Type of order placed by customer',
    })
    @IsEnum(OrderType,
        {message: 'order_type must be one of: DINEIN, TAKEAWAY, DELIVERY'})
    order_type: OrderType;

    @ApiProperty({
        enum: PaymentMethod,
        enumName: 'PaymentMethod',
        example: PaymentMethod.CASH,
        description: 'Payment method used for checkout (CASH or KHQR)',
    })
    @IsEnum(PaymentMethod, {
        message: 'payment_method must be CASH or KHQR',
    })
    payment_method: PaymentMethod;

    @ApiPropertyOptional({
        example: 5,
        description:
            'Required only for DINEIN orders',
    })
    @IsOptional()
    @IsNumber(
        {}, {message: 'table_id must be a valid number',},
    )
    @Min(1, {
        message: 'table_id must be greater than 0',
    })
    table_id?: number;

    @ApiPropertyOptional({
        example: 'Less sugar, no ice',
        description:
            'Additional order notes or customer request',
    })
    @IsOptional()
    @IsString({
        message: 'notes must be a string',
    })
    notes?: string;
}