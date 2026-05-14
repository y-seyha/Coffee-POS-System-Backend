import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
} from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import {JwtAuthGuard} from "./auth/guard/jwt-auth.guard";
import {RoleGuard} from "./auth/guard/role.guard";
import {Roles} from "./auth/decorator/roles.decorator";
import {CategoryService} from "./category/category.service";
import {CreateCategoryDto} from "./category/dto/create_category.dto";
import {UpdateCategoryDto} from "./category/dto/update-category.dto";

@ApiTags('Categories')
@Controller('categories')
@UseGuards(JwtAuthGuard, RoleGuard)
@Roles('admin')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.categoryService.create(dto);
  }

  @Get()
  findAll() {
    return this.categoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.findOne(id);
  }

  @Patch(':id')
  update(
      @Param('id', ParseIntPipe) id: number,
      @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.remove(id);
  }
}