import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    ParseIntPipe,
    Logger,
    UseInterceptors,
    UploadedFiles,
    Req,
    UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GetProductsQueryDto } from './dto/get-products.query.dto';
import {
    ApiOperation,
    ApiTags,
    ApiBearerAuth, ApiResponse,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { Roles } from '../auth/decorator/roles.decorator';
import {RoleGuard} from "../auth/guard/role.guard";
import {AttachProductVariantGroupsDto} from "./dto/attach_variant_group.dto";
import {ClientGetProductsQueryDto} from "./dto/client_get_product.dto";

@ApiTags('Products')
@Controller('products')
export class ProductController {
    private readonly logger = new Logger(ProductController.name);

    constructor(private readonly productService: ProductService) {}

    //client
    @Get('client')
    @ApiOperation({
        summary: 'Client product listing',
        description: 'Public product list with search, filter, sort, pagination',
    })
    findClientProducts(@Query() query: ClientGetProductsQueryDto) {
        return this.productService.clientFindAll(query);
    }

    //assign discount to products
    @Post(':id/discount')
    assignDiscount(
        @Param('id', ParseIntPipe) id: number,
        @Body('discountId') discountId: number,
    ) {
        return this.productService.assignDiscount(id, discountId);
    }

    @Delete(':id/discount')
    removeDiscount(@Param('id', ParseIntPipe) id: number) {
        return this.productService.removeDiscount(id);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('ADMIN')
    @ApiBearerAuth('access-token')
    @ApiOperation({
        summary: 'Get all products',
        description:
            'Retrieve paginated product list with filters (search, category, sorting)',
    })
    findAll(@Query() query: GetProductsQueryDto) {
        return this.productService.findAll(query);
    }

    @Get('category/:categoryId')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('ADMIN')
    @ApiBearerAuth('access-token')
    @ApiOperation({
        summary: 'Get products by category',
        description: 'Fetch all products belonging to a specific category',
    })
    findByCategory(
        @Param('categoryId', ParseIntPipe) categoryId: number,
    ) {
        this.logger.log(`GET /products/category/${categoryId}`);
        return this.productService.findByCategory(categoryId);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('ADMIN')
    @ApiBearerAuth('access-token')
    @ApiOperation({
        summary: 'Get product by ID',
        description:
            'Fetch single product with category, images, and variant groups',
    })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.productService.findOne(id);
    }

    @Post()
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('ADMIN')
    @ApiBearerAuth('access-token')
    @UseInterceptors(FilesInterceptor('files'))
    @ApiOperation({
        summary: 'Create product (Admin only)',
        description:
            'Create product with optional image upload (multipart/form-data)',
    })
    create(
        @UploadedFiles() files: Express.Multer.File[],
        @Body() dto: CreateProductDto,
        @Req() req: Request,
    ) {
        const userId = (req as any).user?.id;

        return this.productService.create(dto, files, userId);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('ADMIN')
    @ApiBearerAuth('access-token')
    @ApiOperation({
        summary: 'Update product (Admin only)',
        description:
            'Update product fields such as name, price, SKU, category',
    })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: UpdateProductDto,
    ) {
        return this.productService.update(id, dto);
    }

    @Post(':id/variant-groups')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('ADMIN')
    @ApiOperation({
        summary: 'Attach variant groups to product',
        description:
            'Replace all existing variant groups and attach new ones to product',
    })
    @ApiBearerAuth('access-token')
    @ApiResponse({
        status: 200,
        description: 'Variant groups attached successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Product not found',
    })
    attachVariantGroups(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: AttachProductVariantGroupsDto,
    ) {
        return this.productService.attachVariantGroups(id, dto);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('ADMIN')
    @ApiBearerAuth('access-token')
    @ApiOperation({
        summary: 'Delete product (Admin only)',
        description: 'Remove product permanently from database',
    })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.productService.remove(id);
    }



}