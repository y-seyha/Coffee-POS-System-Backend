import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import * as Joi from 'joi';
import {ConfigModule, ConfigService} from "@nestjs/config";
import {TypeOrmModule} from "@nestjs/typeorm";
import { FileUploadModule } from './file-upload/file-upload.module';
import {CloudinaryModule} from "./file-upload/cloudinary/cloudinary.module";
import { AuthModule } from './auth/auth.module';
import {ThrottlerGuard, ThrottlerModule} from "@nestjs/throttler";
import {APP_GUARD} from "@nestjs/core";
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
import { VariantManagementModule } from './variant-management/variant-management.module';
import { CartModule } from './cart/cart.module';
import { RoleModule } from './role/role.module';
import { UsersModule } from './users/users.module';
import { DiscountsModule } from './discounts/discounts.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payment/payment.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 5,
      },
    ]),

    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_HOST: Joi.string().required(),
        DATABASE_PORT: Joi.number().default(5432),
        DATABASE_USER: Joi.string().required(),
        DATABASE_PASSWORD: Joi.string().required(),
        DATABASE_NAME: Joi.string().required(),
      }),
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DATABASE_HOST'),
        port: config.get<number>('DATABASE_PORT'),
        username: config.get('DATABASE_USER'),
        password: config.get('DATABASE_PASSWORD'),
        database: config.get('DATABASE_NAME'),
        entities: [__dirname + '/common/entities/*.entity{.ts,.js}'],
        synchronize: true,
        //pg
        // ssl: process.env.NODE_ENV === 'production'
        //     ? { rejectUnauthorized: false }
        //     : false,

        // neon
        ssl: { rejectUnauthorized: false }
      }),
    }),

    FileUploadModule,
    CloudinaryModule,
    AuthModule,
    CategoryModule,
    ProductModule,
    VariantManagementModule,
    CartModule,
    RoleModule,
    UsersModule,
    DiscountsModule,
    OrdersModule,
    PaymentsModule

  ],
  controllers: [],
  providers: [
      {
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
  },
    AppService],
})
export class AppModule {}
