import {BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {VariantGroup} from "../common/entities/variant_groups.entity";
import {Repository} from "typeorm";
import {CreateVariantGroupDto} from "./dto/variant-groups/create_variant_group.dto";
import {UpdateVariantGroupDto} from "./dto/variant-groups/update_variant_group.dto";

@Injectable()
export class VariantGroupsService {
    private readonly logger = new Logger(VariantGroupsService.name);

    constructor(
        @InjectRepository(VariantGroup)
        private readonly variantGroupRepository: Repository<VariantGroup>,
    ) {}

    async create(createDto: CreateVariantGroupDto) {
        try {
            const existing = await this.variantGroupRepository.findOne({
                where: [
                    { name: createDto.name },
                    { code: createDto.code },
                ],
            });

            if (existing) {
                throw new BadRequestException(
                    'Variant group name or code already exists',
                );
            }

            const variantGroup = this.variantGroupRepository.create(createDto);

            const saved = await this.variantGroupRepository.save(variantGroup);

            this.logger.log(`Variant group created: ${saved.name}`);

            return {
                message: 'Variant group created successfully',
                data: saved,
            };
        } catch (error) {
            this.logger.error('Failed to create variant group', error.stack);

            if (
                error instanceof BadRequestException ||
                error instanceof NotFoundException
            ) {
                throw error;
            }

            throw new InternalServerErrorException(
                'Failed to create variant group',
            );
        }
    }

    async findAll() {
        try {
            const data = await this.variantGroupRepository.find({
                relations: ['options'],
                order: {
                    sort_order: 'ASC',
                },
            });

            return {
                message: 'Variant groups fetched successfully',
                data,
            };
        } catch (error) {
            this.logger.error('Failed to fetch variant groups', error.stack);

            throw new InternalServerErrorException(
                'Failed to fetch variant groups',
            );
        }
    }

    async findOne(id: number) {
        try {
            const variantGroup = await this.variantGroupRepository.findOne({
                where: { id },
                relations: ['options'],
            });

            if (!variantGroup) {
                throw new NotFoundException('Variant group not found');
            }

            return {
                message: 'Variant group fetched successfully',
                data: variantGroup,
            };
        } catch (error) {
            this.logger.error('Failed to fetch variant group', error.stack);

            if (error instanceof NotFoundException) {
                throw error;
            }

            throw new InternalServerErrorException(
                'Failed to fetch variant group',
            );
        }
    }

    async update(id: number, updateDto: UpdateVariantGroupDto) {
        try {
            const variantGroup = await this.variantGroupRepository.findOne({
                where: { id },
            });

            if (!variantGroup) {
                throw new NotFoundException('Variant group not found');
            }

            Object.assign(variantGroup, updateDto);

            const updated = await this.variantGroupRepository.save(variantGroup);

            this.logger.log(`Variant group updated: ${updated.name}`);

            return {
                message: 'Variant group updated successfully',
                data: updated,
            };
        } catch (error) {
            this.logger.error('Failed to update variant group', error.stack);

            if (error instanceof NotFoundException) {
                throw error;
            }

            throw new InternalServerErrorException(
                'Failed to update variant group',
            );
        }
    }

    async remove(id: number) {
        try {
            const variantGroup = await this.variantGroupRepository.findOne({
                where: { id },
            });

            if (!variantGroup) {
                throw new NotFoundException('Variant group not found');
            }

            await this.variantGroupRepository.remove(variantGroup);

            this.logger.log(`Variant group deleted: ${variantGroup.name}`);

            return {
                message: 'Variant group deleted successfully',
            };
        } catch (error) {
            this.logger.error('Failed to delete variant group', error.stack);

            if (error instanceof NotFoundException) {
                throw error;
            }

            throw new InternalServerErrorException(
                'Failed to delete variant group',
            );
        }
    }
}