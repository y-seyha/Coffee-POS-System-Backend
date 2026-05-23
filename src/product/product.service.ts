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
import {AttachProductVariantGroupsDto} from "./dto/attach_variant_group.dto";
import { File } from '../common/entities/file_upload.entity';
import {ClientGetProductsQueryDto} from "./dto/client_get_product.dto";
import {Discount} from "../common/entities/discount.entity";
import {AttachSingleVariantGroupDto} from "./dto/attach_single_variant_group.dto";

@Injectable()
export class ProductService {
    private readonly logger = new Logger(ProductService.name);

    constructor(
        @InjectRepository(Product)
        private readonly productRepo: Repository<Product>,

        @InjectRepository(ProductVariantGroup)
        private readonly productVariantGroupRepo: Repository<ProductVariantGroup>,

        @InjectRepository(Discount)
        private readonly discountRepo: Repository<Discount>,

        private readonly fileUploadService: FileUploadService,
    ) {}

    async findAll(query: GetProductsQueryDto) {
        try {
            const { page = 1, limit = 10, search, sortBy = 'id', sortOrder = 'DESC', categoryId } = query;

            const qb = this.productRepo.createQueryBuilder('product')
                .leftJoinAndSelect('product.category', 'category')
                .leftJoinAndSelect('product.images', 'images')
                .leftJoinAndSelect('product.variant_groups', 'variant_groups')
                .leftJoinAndSelect('product.discount', 'discount')
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

            const data = items.map((p) => ({
                ...p,
                final_price: this.calculateFinalPrice(p),
            }));

            return {
                data,
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
                relations: ['category', 'images', 'variant_groups','discount'],
            });

            if (!product) {
                throw new NotFoundException('product not found');
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

        this.logger.log(
            `Starting product creation: name=${dto.name}, sku=${dto.sku}, userId=${userId}`,
        );

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // create product
            const product = queryRunner.manager.create(Product, {
                category_id: dto.category_id,
                name: dto.name,
                sku: dto.sku,
                price: dto.price,
                description: dto.description,
            });

            const savedProduct = await queryRunner.manager.save(product);

            this.logger.log(
                `Product created successfully id=${savedProduct.id}`,
            );

            //  handle files
            if (files?.length) {
                this.logger.log(
                    `Uploading ${files.length} file(s) for product id=${savedProduct.id}`,
                );

                const fileRepo =
                    queryRunner.manager.getRepository(File);

                for (const file of files) {
                    this.logger.log(
                        `Uploading file: ${file.originalname}`,
                    );

                    const cloud =
                        await this.fileUploadService.uploadToCloud(file);

                    const fileEntity = fileRepo.create({
                        originalName: file.originalname,
                        mimeType: file.mimetype,
                        size: file.size,
                        url: cloud.secure_url,
                        publicId: cloud.public_id,
                        uploader: { id: userId } as any,
                        product: { id: savedProduct.id } as any,
                    });

                    await fileRepo.save(fileEntity);

                    this.logger.log(
                        `File saved: ${file.originalname}`,
                    );
                }

                this.logger.log(
                    `All files uploaded for product id=${savedProduct.id}`,
                );
            }

            await queryRunner.commitTransaction();

            this.logger.log(
                `Transaction committed for product id=${savedProduct.id}`,
            );

            return await this.findOne(savedProduct.id);
        } catch (error) {
            await queryRunner.rollbackTransaction();

            this.logger.error(
                `Create product failed (rollback executed)`,
                error.stack,
            );

            throw error;
        } finally {
            await queryRunner.release();

            this.logger.log(`QueryRunner released`);
        }
    }

    async update(
        id: number,
        dto: UpdateProductDto,
        files: Express.Multer.File[],
        userId: number,
    ) {
        const queryRunner =
            this.productRepo.manager.connection.createQueryRunner();

        this.logger.log(`Updating product id=${id}`);

        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const product = await queryRunner.manager.findOne(Product, {
                where: { id },
            });

            if (!product) {
                throw new NotFoundException('product not found');
            }

            // update product fields
            await queryRunner.manager.update(Product, id, {
                category_id: dto.category_id,
                name: dto.name,
                sku: dto.sku,
                price: dto.price,
                description: dto.description,
            });

            const updatedProduct = await queryRunner.manager.findOne(Product, {
                where: { id },
            });

            // handle new files (optional append)
            if (files?.length) {
                this.logger.log(
                    `Uploading ${files.length} new file(s) for product id=${id}`,
                );

                const fileRepo =
                    queryRunner.manager.getRepository(File);

                for (const file of files) {
                    const cloud =
                        await this.fileUploadService.uploadToCloud(file);

                    const fileEntity = fileRepo.create({
                        originalName: file.originalname,
                        mimeType: file.mimetype,
                        size: file.size,
                        url: cloud.secure_url,
                        publicId: cloud.public_id,
                        uploader: { id: userId } as any,
                        product: { id } as any,
                    });

                    await fileRepo.save(fileEntity);
                }
            }

            await queryRunner.commitTransaction();

            return this.findOne(id);

        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Update failed id=${id}`, error.stack);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async remove(id: number) {
        try {
            const product = await this.productRepo.findOne({ where: { id } });

            if (!product) {
                throw new NotFoundException('product not found');
            }

            await this.productRepo.delete(id);

            this.logger.log(`Product deleted id=${id}`);

            return {
                message: 'product deleted successfully',
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

    async attachVariantGroups(
        productId: number,
        dto: AttachProductVariantGroupsDto,
    ) {
        this.logger.log(
            `Attaching variant groups to product id=${productId}`,
        );

        try {
            const product = await this.productRepo.findOne({
                where: { id: productId },
            });

            if (!product) {
                this.logger.warn(
                    `Product not found id=${productId}`,
                );
                throw new NotFoundException('product not found');
            }

            // remove duplicates from request
            const uniqueGroups = Array.from(
                new Map(
                    dto.variant_groups.map((vg) => [
                        vg.variant_group_id,
                        vg,
                    ]),
                ).values(),
            );

            this.logger.log(
                `Unique variant groups count=${uniqueGroups.length} for product id=${productId}`,
            );

            // delete old links
            await this.productVariantGroupRepo.delete({
                product_id: productId,
            });

            this.logger.log(
                `Old variant groups removed for product id=${productId}`,
            );

            // insert new links
            const records = uniqueGroups.map((vg) =>
                this.productVariantGroupRepo.create({
                    product_id: productId,
                    variant_group_id: vg.variant_group_id,
                    is_required: vg.is_required ?? true,
                    sort_order: vg.sort_order ?? 0,
                }),
            );

            await this.productVariantGroupRepo.save(records);

            this.logger.log(
                `Attached ${records.length} variant groups to product id=${productId}`,
            );

            return {
                message: 'Variant groups attached successfully',
                count: records.length,
            };
        } catch (error) {
            this.logger.error(
                `Failed to attach variant groups for product id=${productId}`,
                error.stack,
            );
            throw error;
        }
    }

    async attachSingleVariantGroup(productId: number, dto: AttachSingleVariantGroupDto) {
        const product = await this.productRepo.findOne({
            where: { id: productId },
        });

        if (!product) {
            throw new NotFoundException('product not found');
        }

        // check if already exists
        const existing = await this.productVariantGroupRepo.findOne({
            where: {
                product_id: productId,
                variant_group_id: dto.variant_group_id,
            },
        });

        if (existing) {
            throw new BadRequestException('Variant group already attached');
        }

        const record = this.productVariantGroupRepo.create({
            product_id: productId,
            variant_group_id: dto.variant_group_id,
            is_required: dto.is_required ?? true,
            sort_order: dto.sort_order ?? 0,
        });

        await this.productVariantGroupRepo.save(record);

        return {
            message: 'Variant group attached',
        };
    }

    async clientFindAll(query: ClientGetProductsQueryDto) {
        try {
            const {
                page = 1,
                limit = 50,
                search,
                categoryId,
                sort = 'default',
            } = query;

            const qb = this.productRepo
                .createQueryBuilder('product')
                .leftJoinAndSelect('product.images', 'images')
                .leftJoinAndSelect('product.category', 'category')
                .leftJoinAndSelect('product.discount', 'discount')
                .leftJoinAndSelect('product.variant_groups', 'variant_groups')
                .leftJoinAndSelect('variant_groups.variant_group', 'variant_group')
                .leftJoinAndSelect('variant_group.options', 'options')
                .where('product.is_active = true')
                .andWhere('product.is_available = true')
                .skip((page - 1) * limit)
                .take(limit);

            //  search by name or sku
            if (search) {
                qb.andWhere(
                    '(product.name ILIKE :search OR product.sku ILIKE :search)',
                    { search: `%${search}%` },
                );
            }

            //  filter by categories
            if (categoryId) {
                qb.andWhere('product.category_id = :categoryId', {
                    categoryId,
                });
            }

            //  sorting
            switch (sort) {
                case 'price_asc':
                    qb.orderBy('product.price', 'ASC');
                    break;

                case 'price_desc':
                    qb.orderBy('product.price', 'DESC');
                    break;

                case 'newest':
                    qb.orderBy('product.created_at', 'DESC');
                    break;

                case 'name_asc':
                    qb.orderBy('product.name', 'ASC');
                    break;

                default:
                    qb.orderBy('product.sort_order', 'ASC');
                    break;
            }

            const [items, total] = await qb.getManyAndCount();

            return {
                data: items,
                meta: {
                    total,
                    page,
                    lastPage: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            this.logger.error('Client product fetch failed', error.stack);
            throw new BadRequestException('Failed to fetch products');
        }
    }

    async assignDiscount(productId: number, discountId: number) {
        const product = await this.productRepo.findOne({
            where: { id: productId },
            relations: ['discount'],
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        const discount = await this.discountRepo.findOne({
            where: { id: discountId },
        });

        if (!discount) {
            throw new NotFoundException('Discount not found');
        }

        // prevent inactive/expired discounts
        if (!this.isDiscountValid(discount)) {
            throw new BadRequestException(
                'Cannot assign inactive or expired discount',
            );
        }

        //void reassigning same discount
        if (product.discount_id === discount.id) {
            throw new BadRequestException(
                'Discount already assigned to product',
            );
        }

        product.discount = discount;

        const updated = await this.productRepo.save(product);

        return {
            message: 'Discount assigned successfully',
            productId,
            discountId,
            product: updated,
        };
    }

    async removeDiscount(productId: number) {
        const product = await this.productRepo.findOne({ where: { id: productId } });

        if (!product) throw new NotFoundException('product not found');

        product.discount_id = null;

        return this.productRepo.save(product);
    }

    async findBestSellers(limit = 10) {
        const qb = this.productRepo
            .createQueryBuilder('product')
            .leftJoin('order_items', 'oi', 'oi.product_id = product.id')
            .leftJoinAndSelect('product.images', 'images')
            .leftJoinAndSelect('product.category', 'category')
            .leftJoinAndSelect('product.discount', 'discount')
            .where('product.is_active = true')
            .groupBy('product.id')
            .addGroupBy('images.id')
            .addGroupBy('category.id')
            .addGroupBy('discount.id')
            .addSelect('COALESCE(SUM(oi.quantity), 0)', 'sold')
            .orderBy('sold', 'DESC')
            .take(limit);

        const items = await qb.getRawAndEntities();

        return {
            data: items.entities.map((p, i) => ({
                ...p,
                sold: Number(items.raw[i]?.sold ?? 0),
                final_price: this.calculateFinalPrice(p),
            })),
        };
    }


    async setAvailability(productId: number, is_available: boolean) {
        const product = await this.productRepo.findOne({
            where: { id: productId },
        });

        if (!product) {
            throw new NotFoundException('product not found');
        }

        product.is_available = is_available;

        await this.productRepo.save(product);

        this.logger.log(
            `Product availability updated id=${productId} => ${is_available}`,
        );

        return {
            message: 'Product availability updated',
            id: productId,
            is_available,
        };
    }

    private calculateFinalPrice(product: Product): number {
        const price = Number(product.price);

        if (!product.discount || !this.isDiscountValid(product.discount)) {
            return price;
        }

        const value = Number(product.discount.value);

        if (product.discount.type === 'PERCENTAGE') {
            const discountAmount = (price * value) / 100;
            return Math.max(price - discountAmount, 0);
        }

        if (product.discount.type === 'FIXED') {
            return Math.max(price - value, 0);
        }

        return price;
    }

    private isDiscountValid(discount: Discount): boolean {
        const now = new Date();

        if (!discount.is_active) return false;
        if (discount.start_date && discount.start_date > now) return false;
        if (discount.end_date && discount.end_date < now) return false;

        return true;
    }
}