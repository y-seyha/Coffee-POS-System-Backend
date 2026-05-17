import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    ParseIntPipe, UseGuards,
} from '@nestjs/common';

import { RoleService } from './role.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {Role} from "../common/entities/roles.entity";
import {JwtAuthGuard} from "../auth/guard/jwt-auth.guard";
import {RoleGuard} from "../auth/guard/role.guard";
import {Roles} from "../auth/decorator/roles.decorator";



@ApiTags('Roles')
@Controller('roles')
@UseGuards(JwtAuthGuard, RoleGuard)
export class RoleController {
    constructor(private readonly roleService: RoleService) {}

    @Post()
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Create role' })
    create(@Body() dto: CreateRoleDto) {
        return this.roleService.create(dto);
    }

    @Get()
    @Roles('ADMIN')
    findAll() {
        return this.roleService.findAll();
    }

    @Get(':id')
    @Roles('ADMIN')
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.roleService.findOne(id);
    }

    @Patch(':id')
    @Roles('ADMIN')
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateRoleDto,
    ) {
        return this.roleService.update(id, dto);
    }

    @Delete(':id')
    @Roles('ADMIN')
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.roleService.remove(id);
    }
}