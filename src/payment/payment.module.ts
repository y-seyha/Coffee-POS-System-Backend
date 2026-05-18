import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PaymentsController } from './payment.controller';
import { PaymentsService } from './payment.service';

import { Payment } from '../common/entities/payment.entity';
import { PaymentStatusHistory } from '../common/entities/payment_status_history.entity';
import { Order } from '../common/entities/orders.entity';
import {OrderStatusHistory} from "../common/entities/order_status_history.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      PaymentStatusHistory,
      Order,
      OrderStatusHistory
    ]),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService], //use at cat module //aka checkout service
})
export class PaymentsModule {}