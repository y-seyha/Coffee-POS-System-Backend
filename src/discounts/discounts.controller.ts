import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    ParseIntPipe,
    UseGuards,
} from '@nestjs/common';

import {
    ApiBearerAuth,
    ApiTags,
    ApiOperation,
    ApiResponse,
} from '@nestjs/swagger';

import { DiscountsService } from './discounts.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';

import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RoleGuard } from '../auth/guard/role.guard';
import { Roles } from '../auth/decorator/roles.decorator';

@ApiTags('Discounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('ADMIN')
@Controller('discounts')
export class DiscountsController {
    constructor(private readonly service: DiscountsService) {}

    @Post()
    @ApiOperation({ summary: 'Create a new discount (Admin only)' })
    @ApiResponse({ status: 201, description: 'Discount created successfully' })
    create(@Body() dto: CreateDiscountDto) {
        return this.service.create(dto);
    }
    @Get()
    @ApiOperation({ summary: 'Get all discounts (Admin only)' })
    @ApiResponse({ status: 200, description: 'List of discounts' })
    findAll() {
        return this.service.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get discount by ID' })
    @ApiResponse({ status: 200, description: 'Discount details' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.service.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update discount by ID' })
    @ApiResponse({ status: 200, description: 'Discount updated successfully' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateDiscountDto,
    ) {
        return this.service.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete discount by ID' })
    @ApiResponse({ status: 200, description: 'Discount deleted successfully' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.service.remove(id);
    }

    @Patch(':id/toggle')
    @ApiOperation({ summary: 'Toggle discount active/inactive status' })
    @ApiResponse({ status: 200, description: 'Status toggled successfully' })
    toggle(@Param('id', ParseIntPipe) id: number) {
        return this.service.toggleStatus(id);
    }
}