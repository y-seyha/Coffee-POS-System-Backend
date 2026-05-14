import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { User } from '../common/entities/user.entity';
import { Role } from '../common/entities/roles.entity';

import { MailerService } from '../utils/mailer';

import { JwtStrategy } from './strategies/jwt.strategy';
import {PassportModule} from "@nestjs/passport";

@Module({
  imports: [
    TypeOrmModule.forFeature([User,Role,]),

    PassportModule.register({ defaultStrategy: 'jwt' }),

    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super_secret_key',
      signOptions: {
        expiresIn: '15m',
      },
    }),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,
    MailerService,
    JwtStrategy,
  ],

  exports: [
    AuthService,
    JwtModule,
  ],
})
export class AuthModule {}