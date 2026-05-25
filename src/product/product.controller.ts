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
import {AttachSingleVariantGroupDto} from "./dto/attach_single_variant_group.dto";

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

    //best-sellers
    @Get('best-sellers')
    @ApiOperation({
        summary: 'Get best selling products',
    })
    findBestSellers(@Query('limit') limit?: number) {
        return this.productService.findBestSellers(Number(limit || 10));
    }

    //assign discount to products
    @Post(':id/discount')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('ADMIN')
    assignDiscount(
        @Param('id', ParseIntPipe) id: number,
        @Body('discountId') discountId: number,
    ) {
        return this.productService.assignDiscount(id, discountId);
    }

    @Patch(':id/availability')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('ADMIN')
    @ApiBearerAuth('access-token')
    @ApiOperation({
        summary: 'Toggle product availability (in stock / out of stock)',
    })
    setAvailability(
        @Param('id', ParseIntPipe) id: number,
        @Body('is_available') is_available: boolean,
    ) {
        return this.productService.setAvailability(id, is_available);
    }

    @Delete(':id/discount')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('ADMIN')
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
            'Retrieve paginated product list with filters (search, categories, sorting)',
    })
    findAll(@Query() query: GetProductsQueryDto) {
        return this.productService.findAll(query);
    }


    @Get('categories/:categoryId')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @ApiBearerAuth('access-token')
    @ApiOperation({
        summary: 'Get products by categories',
        description: 'Fetch all products belonging to a specific categories',
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
            'Fetch single product with categories, images, and variant groups',
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
    @UseInterceptors(FilesInterceptor('files'))
    update(
        @Param('id', ParseIntPipe) id: number,
        @UploadedFiles() files: Express.Multer.File[],
        @Body() dto: UpdateProductDto,
        @Req() req: Request,
    ) {
        const userId = (req as any).user?.id;

        return this.productService.update(
            id,
            dto,
            files,
            userId,
        );
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
        description: 'product not found',
    })
    attachVariantGroups(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: AttachProductVariantGroupsDto,
    ) {
        return this.productService.attachVariantGroups(id, dto);
    }

    @Post(':id/variant-group')
    @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles('ADMIN')
    @ApiBearerAuth('access-token')
    @ApiOperation({
        summary: 'Attach single variant group to product',
    })
    @ApiResponse({
        status: 200,
        description: 'Variant group attached successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'Product or variant group not found',
    })
    attachSingleVariantGroup(
        @Param('id', ParseIntPipe) id: number,
        @Body() dto: AttachSingleVariantGroupDto,
    ) {
        return this.productService.attachSingleVariantGroup(id, dto);
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