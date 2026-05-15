import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Product} from "../common/entities/product.entity";
import {ProductVariantGroup} from "../common/entities/product_variant_groups.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductVariantGroup,
    ]),
  ],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}