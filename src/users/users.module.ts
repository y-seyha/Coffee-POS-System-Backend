import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import {User} from "../common/entities/user.entity";
import {Role} from "../common/entities/roles.entity";
import {StaffProfile} from "../common/entities/staff_profile.entity";

@Module({
  imports : [
      TypeOrmModule.forFeature([User, Role, StaffProfile])

  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
