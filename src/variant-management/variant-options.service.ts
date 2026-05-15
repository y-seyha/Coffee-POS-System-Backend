import {BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {VariantOption} from "../common/entities/variant_options.entity";
import {Repository} from "typeorm";
import {VariantGroup} from "../common/entities/variant_groups.entity";
import {CreateVariantOptionDto} from "./dto/variant-options/create_variant_option.dto";
import {UpdateVariantOptionDto} from "./dto/variant-options/update_variant_option.dto";

@Injectable()
export class VariantOptionsService{
    private readonly logger = new Logger(VariantOptionsService.name);

    constructor(
        @InjectRepository(VariantOption)
        private readonly variantOptionRepository: Repository<VariantOption>,

        @InjectRepository(VariantGroup)
        private readonly variantGroupRepository: Repository<VariantGroup>,
    ) {}

    async create(createDto: CreateVariantOptionDto) {
        try {
            const variantGroup = await this.variantGroupRepository.findOne({
                where: {
                    id: createDto.variant_group_id,
                },
            });

            if (!variantGroup) {
                throw new NotFoundException('Variant group not found');
            }

            const option = this.variantOptionRepository.create(createDto);

            const saved = await this.variantOptionRepository.save(option);

            this.logger.log(`Variant option created: ${saved.name}`);

            return {
                message: 'Variant option created successfully',
                data: saved,
            };
        } catch (error) {
            this.logger.error('Failed to create variant option', error.stack);

            if (
                error instanceof NotFoundException ||
                error instanceof BadRequestException
            ) {
                throw error;
            }

            throw new InternalServerErrorException(
                'Failed to create variant option',
            );
        }
    }


    async findAll() {
        try {
            const data = await this.variantOptionRepository.find({
                relations: ['variant_group'],
            });

            return {
                message: 'Variant options fetched successfully',
                data,
            };
        } catch (error) {
            this.logger.error('Failed to fetch variant options', error.stack);

            throw new InternalServerErrorException(
                'Failed to fetch variant options',
            );
        }
    }

    async update(id: number, updateDto: UpdateVariantOptionDto) {
        try {
            const option = await this.variantOptionRepository.findOne({
                where: { id },
            });

            if (!option) {
                throw new NotFoundException('Variant option not found');
            }

            Object.assign(option, updateDto);

            const updated = await this.variantOptionRepository.save(option);

            this.logger.log(`Variant option updated: ${updated.name}`);

            return {
                message: 'Variant option updated successfully',
                data: updated,
            };
        } catch (error) {
            this.logger.error('Failed to update variant option', error.stack);

            if (error instanceof NotFoundException) {
                throw error;
            }

            throw new InternalServerErrorException(
                'Failed to update variant option',
            );
        }
    }

    async remove(id: number) {
        try {
            const option = await this.variantOptionRepository.findOne({
                where: { id },
            });

            if (!option) {
                throw new NotFoundException('Variant option not found');
            }

            await this.variantOptionRepository.remove(option);

            this.logger.log(`Variant option deleted: ${option.name}`);

            return {
                message: 'Variant option deleted successfully',
            };
        } catch (error) {
            this.logger.error('Failed to delete variant option', error.stack);

            if (error instanceof NotFoundException) {
                throw error;
            }

            throw new InternalServerErrorException(
                'Failed to delete variant option',
            );
        }
    }
}