import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Product} from "../common/entities/product.entity";
import {ProductVariantGroup} from "../common/entities/product_variant_groups.entity";
import {FileUploadModule} from "../file-upload/file-upload.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      ProductVariantGroup,
    ]),
    FileUploadModule
  ],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}