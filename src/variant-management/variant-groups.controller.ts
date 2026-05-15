import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
} from '@nestjs/common';

import {
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';

import { VariantGroupsService } from './variant-groups.service';
import {CreateVariantGroupDto} from "./dto/variant-groups/create_variant_group.dto";
import {UpdateVariantGroupDto} from "./dto/variant-groups/update_variant_group.dto";



@ApiTags('Admin Variant Groups')
@Controller('admin/variant-groups')
export class VariantGroupsController {
    constructor(
        private readonly variantGroupsService: VariantGroupsService,
    ) {}

    @Post()
    @ApiOperation({ summary: 'Create variant group' })
    @ApiResponse({ status: 201, description: 'Variant group created' })
    create(@Body() dto: CreateVariantGroupDto) {
        return this.variantGroupsService.create(dto);
    }

    @Get()
    @ApiOperation({ summary: 'Get all variant groups' })
    findAll() {
        return this.variantGroupsService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get variant group by id' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.variantGroupsService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update variant group' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateVariantGroupDto,
    ) {
        return this.variantGroupsService.update(id, dto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete variant group' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.variantGroupsService.remove(id);
    }
}