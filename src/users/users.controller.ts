import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    ParseIntPipe,
    Patch,
    Delete,
} from '@nestjs/common';

import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { Roles } from '../auth/decorator/roles.decorator';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RoleGuard } from '../auth/guard/role.guard';
import { UseGuards } from '@nestjs/common';
import {ResetPasswordDto} from "./dto/reset-password.dto";

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RoleGuard)
export class UsersController {
    constructor(private readonly userService: UsersService) {}

    @Post()
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Create user (staff or admin)' })
    create(@Body() dto: CreateUserDto) {
        return this.userService.create(dto);
    }

    @Get()
    @Roles('ADMIN')
    findAll() {
        return this.userService.findAll();
    }

    @Get(':id')
    @Roles('ADMIN')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.userService.findOne(id);
    }

    @Patch(':id')
    @Roles('ADMIN')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateUserDto,
    ) {
        return this.userService.update(id, dto);
    }

    @Delete(':id')
    @Roles('ADMIN')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.userService.remove(id);
    }

    @Patch(':id/toggle-status')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Enable/Disable user' })
    toggle(@Param('id', ParseIntPipe) id: number) {
        return this.userService.toggleStatus(id);
    }


    @Patch(':id/role/:roleId')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Change user role' })
    changeRole(
        @Param('id', ParseIntPipe) id: number,
        @Param('roleId', ParseIntPipe) roleId: number,
    ) {
        return this.userService.changeRole(id, roleId);
    }

    @Patch(':id/reset-password')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Reset user password (ADMIN only)' })
    resetPassword(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: ResetPasswordDto,
    ) {
        return this.userService.resetPassword(id, dto.new_password);
    }
}