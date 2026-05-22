import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post, UseGuards,
} from '@nestjs/common';

import {
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';

import { VariantOptionsService } from './variant-options.service';
import {CreateVariantOptionDto} from "./dto/variant-options/create_variant_option.dto";
import {UpdateVariantOptionDto} from "./dto/variant-options/update_variant_option.dto";
import {JwtAuthGuard} from "../auth/guard/jwt-auth.guard";
import {RoleGuard} from "../auth/guard/role.guard";
import {Roles} from "../auth/decorator/roles.decorator";

@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('ADMIN')
@ApiTags('Admin Variant Options')
@Controller('admin/variant-options')
export class VariantOptionsController {
    constructor(
        private readonly variantOptionsService: VariantOptionsService,
    ) {}

    @Post()
    @ApiOperation({ summary: 'Create variant option' })
    @ApiResponse({ status: 201, description: 'Variant option created' })
    create(@Body() dto: CreateVariantOptionDto) {
        return this.variantOptionsService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all variant options' })
    findAll() {
        return this.variantOptionsService.findAll();
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update variant option' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateVariantOptionDto,
    ) {
        return this.variantOptionsService.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete variant option' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.variantOptionsService.remove(id);
    }
}