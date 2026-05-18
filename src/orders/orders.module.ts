import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

import { Order } from '../common/entities/orders.entity';
import { OrderStatusHistory } from '../common/entities/order_status_history.entity';
import {Payment} from "../common/entities/payment.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderStatusHistory, Payment]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}