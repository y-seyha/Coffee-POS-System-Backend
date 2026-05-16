import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';

import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

import { User } from '../common/entities/user.entity';
import { Role } from '../common/entities/roles.entity';

import { MailerService } from '../utils/mailer';

import { JwtStrategy } from './strategies/jwt.strategy';
import {ConfigModule, ConfigService} from "@nestjs/config";

@Module({
  imports: [
    TypeOrmModule.forFeature([User,Role]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
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

  ],
})
export class AuthModule {}