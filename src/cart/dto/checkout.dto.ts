import {
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator';

import { OrderType } from '../../common/entities/orders.entity';

export class CheckoutDto {

    @IsEnum(OrderType)
    order_type: OrderType;

    @IsOptional()
    @IsNumber()
    table_id?: number;

    @IsOptional()
    @IsString()
    notes?: string;
}