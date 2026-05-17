import {
    Injectable,
    NotFoundException,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Discount } from '../common/entities/discount.entity';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';

@Injectable()
export class DiscountsService {
    private readonly logger = new Logger(DiscountsService.name);

    constructor(
        @InjectRepository(Discount)
        private readonly discountRepo: Repository<Discount>,
    ) {}

    async create(dto: CreateDiscountDto) {
        try {
            const discount = this.discountRepo.create(dto);

            const saved = await this.discountRepo.save(discount);

            this.logger.log(`Discount created: ID=${saved.id}`);

            return saved;
        } catch (error) {
            this.logger.error('Failed to create discount', error.stack);
            throw new InternalServerErrorException('Failed to create discount');
        }
    }

    async findAll() {
        try {
            return await this.discountRepo.find({
                order: { id: 'DESC' },
            });
        } catch (error) {
            this.logger.error('Failed to fetch discounts', error.stack);
            throw new InternalServerErrorException('Failed to fetch discounts');
        }
    }

    async findOne(id: number) {
        try {
            const discount = await this.discountRepo.findOne({
                where: { id },
            });

            if (!discount) {
                throw new NotFoundException(`Discount with ID ${id} not found`);
            }

            return discount;
        } catch (error) {
            if (error instanceof NotFoundException) throw error;

            this.logger.error(`Failed to fetch discount ID=${id}`, error.stack);
            throw new InternalServerErrorException('Failed to fetch discount');
        }
    }

    async update(id: number, dto: UpdateDiscountDto) {
        try {
            const discount = await this.findOne(id);

            Object.assign(discount, dto);

            const updated = await this.discountRepo.save(discount);

            this.logger.log(`Discount updated: ID=${id}`);

            return updated;
        } catch (error) {
            if (error instanceof NotFoundException) throw error;

            this.logger.error(`Failed to update discount ID=${id}`, error.stack);
            throw new InternalServerErrorException('Failed to update discount');
        }
    }

    async remove(id: number) {
        try {
            const discount = await this.findOne(id);

            await this.discountRepo.remove(discount);

            this.logger.log(`Discount deleted: ID=${id}`);

            return { message: 'Discount deleted successfully' };
        } catch (error) {
            if (error instanceof NotFoundException) throw error;

            this.logger.error(`Failed to delete discount ID=${id}`, error.stack);
            throw new InternalServerErrorException('Failed to delete discount');
        }
    }

    async toggleStatus(id: number) {
        try {
            const discount = await this.findOne(id);

            discount.is_active = !discount.is_active;

            const updated = await this.discountRepo.save(discount);

            this.logger.log(
                `Discount status toggled: ID=${id}, active=${updated.is_active}`,
            );

            return updated;
        } catch (error) {
            if (error instanceof NotFoundException) throw error;

            this.logger.error(`Failed to toggle discount ID=${id}`, error.stack);
            throw new InternalServerErrorException('Failed to toggle status');
        }
    }
}