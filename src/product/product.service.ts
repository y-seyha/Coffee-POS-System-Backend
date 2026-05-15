import {
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Product } from '../common/entities/product.entity';
import { ProductVariantGroup } from '../common/entities/product_variant_groups.entity';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { GetProductsQueryDto } from './dto/get-products.query.dto';
import {FileUploadService} from "../file-upload/file-upload.service";

@Injectable()
export class ProductService {
    private readonly logger = new Logger(ProductService.name);

    constructor(
        @InjectRepository(Product)
        private readonly productRepo: Repository<Product>,

        @InjectRepository(ProductVariantGroup)
        private readonly productVariantGroupRepo: Repository<ProductVariantGroup>,

        private readonly fileUploadService: FileUploadService,
    ) {}

    async findAll(query: GetProductsQueryDto) {
        try {
            const { page = 1, limit = 10, search, sortBy = 'id', sortOrder = 'DESC', categoryId } = query;

            const qb = this.productRepo.createQueryBuilder('product')
                .leftJoinAndSelect('product.category', 'category')
                .leftJoinAndSelect('product.images', 'images')
                .leftJoinAndSelect('product.variant_groups', 'variant_groups')
                .skip((page - 1) * limit)
                .take(limit)
                .orderBy(`product.${sortBy}`, sortOrder as 'ASC' | 'DESC');

            if (search) {
                qb.andWhere(
                    '(product.name ILIKE :search OR product.sku ILIKE :search)',
                    { search: `%${search}%` },
                );
            }

            if (categoryId) {
                qb.andWhere('product.category_id = :categoryId', { categoryId });
            }

            const [items, total] = await qb.getManyAndCount();

            this.logger.log(`Fetched products: ${items.length}`);

            return {
                data: items,
                meta: {
                    total,
                    page,
                    lastPage: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            this.logger.error('Failed to fetch products', error.stack);
            throw new BadRequestException('Failed to fetch products');
        }
    }

    async findOne(id: number) {
        try {
            const product = await this.productRepo.findOne({
                where: { id },
                relations: ['category', 'images', 'variant_groups'],
            });

            if (!product) {
                throw new NotFoundException('Product not found');
            }

            return product;
        } catch (error) {
            this.logger.error(`Find product failed id=${id}`, error.stack);
            throw error;
        }
    }
    async create(
        dto: CreateProductDto,
        files: Express.Multer.File[],
        userId: number,
    ) {
        const queryRunner =
            this.productRepo.manager.connection.createQueryRunner();

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // create product
            const product = this.productRepo.create({
                category_id: dto.category_id,
                name: dto.name,
                sku: dto.sku,
                price: dto.price,
                description: dto.description,
            });

            const savedProduct =
                await queryRunner.manager.save(product);

            // upload files
            if (files?.length) {
                for (const file of files) {
                    await this.fileUploadService.uploadSingleFile({
                        file,
                        userId,
                        productId: savedProduct.id,
                    });
                }
            }

            await queryRunner.commitTransaction();

            return this.findOne(savedProduct.id);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }


    async update(id: number, dto: UpdateProductDto) {
        try {
            const product = await this.productRepo.findOne({ where: { id } });

            if (!product) {
                throw new NotFoundException('Product not found');
            }

            await this.productRepo.update(id, {
                category_id: dto.category_id,
                name: dto.name,
                sku: dto.sku,
                price: dto.price,
                description: dto.description,
            });

            this.logger.log(`Product updated id=${id}`);

            return this.findOne(id);
        } catch (error) {
            this.logger.error(`Update failed id=${id}`, error.stack);
            throw error;
        }
    }


    async remove(id: number) {
        try {
            const product = await this.productRepo.findOne({ where: { id } });

            if (!product) {
                throw new NotFoundException('Product not found');
            }

            await this.productRepo.delete(id);

            this.logger.log(`Product deleted id=${id}`);

            return {
                message: 'Product deleted successfully',
            };
        } catch (error) {
            this.logger.error(`Delete failed id=${id}`, error.stack);
            throw error;
        }
    }

    async findByCategory(categoryId: number) {
        this.logger.log(`Fetching products by category: ${categoryId}`);

        return this.productRepo.find({
            where: { category_id: categoryId },
            relations: ['images', 'variant_groups'],
            order: { sort_order: 'ASC' },
        });
    }
}