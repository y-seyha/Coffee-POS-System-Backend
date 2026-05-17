import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CartService } from './cart.service';
import { CartController } from './cart.controller';

import { Cart } from '../common/entities/cart.entity';
import { CartItem } from '../common/entities/cart_items.entity';
import { Product } from '../common/entities/product.entity';
import { CartItemVariant } from '../common/entities/cart_item_variants.entity';
import {VariantOption} from "../common/entities/variant_options.entity";
import {Order} from "../common/entities/orders.entity";
import {OrderItem} from "../common/entities/order_items.entity";
import {OrderItemVariant} from "../common/entities/order_item_variants.entity";
import {OrderStatusHistory} from "../common/entities/order_status_history.entity";
import {Payment} from "../common/entities/payment.entity";


@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cart,
      CartItem,
      Product,
      CartItemVariant,
      VariantOption,
      Order,OrderItem,OrderItemVariant,OrderStatusHistory,Payment
    ]),
  ],
  providers: [CartService],
  controllers: [CartController],
})
export class CartModule {}