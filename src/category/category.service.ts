import {Injectable, InternalServerErrorException, NotFoundException} from '@nestjs/common';
import {Category} from "../common/entities/category.entity";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {CreateCategoryDto} from "./dto/create_category.dto";
import {UpdateCategoryDto} from "./dto/update-category.dto";

@Injectable()
export class CategoryService {
    constructor(
        @InjectRepository(Category)
        private readonly categoryRepo: Repository<Category>,
    ) {
    }

    async create(dto: CreateCategoryDto) {
        try {
            const category = this.categoryRepo.create(dto);
            return await this.categoryRepo.save(category);
        } catch (error) {
            throw new InternalServerErrorException('Failed to create category');
        }
    }

    async findAll() {
        try {
            return await this.categoryRepo.find({
                relations: ['products'],
                order: { id: 'DESC' },
            });

        } catch (error) {
            throw new InternalServerErrorException('Failed to fetch categories');
        }
    }


    async findOne(id: number) {
        try {
            const category = await this.categoryRepo.findOne({
                where: { id },
                relations: ['products'],
            });

            if (!category) {
                throw new NotFoundException('Category not found');
            }

            return category;
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            throw new InternalServerErrorException('Failed to fetch category');
        }
    }

    async update(id: number, dto: UpdateCategoryDto) {
        try {
            const category = await this.findOne(id);

            Object.assign(category, dto);

            return await this.categoryRepo.save(category);
        } catch (error) {
            throw new InternalServerErrorException('Failed to update category');
        }
    }


    async remove(id: number) {
        try {
            const category = await this.findOne(id);
           await this.categoryRepo.remove(category);

            return {
                success: true,
                message: 'Category deleted successfully',
                deletedCategoryId: id,
            };
        } catch (error) {
            throw new InternalServerErrorException('Failed to delete category');
        }
    }
}
