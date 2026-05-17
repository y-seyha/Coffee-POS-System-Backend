import {
    Injectable,
    Logger,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Role } from '../common/entities/roles.entity';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RoleService {
    private readonly logger = new Logger(RoleService.name);

    constructor(
        @InjectRepository(Role)
        private readonly roleRepo: Repository<Role>,
    ) {}

    async create(dto: CreateRoleDto) {
        try {
            this.logger.log(`Creating role: ${dto.name}`);

            const name = dto.name.toUpperCase();

            const existing = await this.roleRepo.findOne({
                where: { name },
            });

            if (existing) {
                throw new ConflictException('Role already exists');
            }

            const role = this.roleRepo.create({
                name,
                description: dto.description,
            });

            const saved = await this.roleRepo.save(role);

            this.logger.log(`Role created: ${saved.id}`);

            return {
                message: 'Role created successfully',
                data: saved,
            };
        } catch (error) {
            this.logger.error(`Create role failed`, error.stack);

            if (error instanceof ConflictException) throw error;

            throw new BadRequestException('Failed to create role');
        }
    }

    async findAll() {
        try {
            this.logger.log('Fetching all roles');

            return await this.roleRepo.find({
                order: { id: 'DESC' },
                relations: ['users'],
            });
        } catch (error) {
            this.logger.error(error);
            throw new BadRequestException('Failed to fetch roles');
        }
    }

    async findOne(id: number) {
        try {
            const role = await this.roleRepo.findOne({
                where: { id },
                relations: ['users'],
            });

            if (!role) {
                throw new NotFoundException('Role not found');
            }

            return role;
        } catch (error) {
            this.logger.error(error);

            if (error instanceof NotFoundException) throw error;

            throw new BadRequestException('Failed to fetch role');
        }
    }

    async update(id: number, dto: UpdateRoleDto) {
        try {
            const role = await this.findOne(id);

            if (dto.name) {
                dto.name = dto.name.toUpperCase();
            }

            Object.assign(role, dto);

            const updated = await this.roleRepo.save(role);

            this.logger.log(`Role updated: ${id}`);

            return {
                message: 'Role updated successfully',
                data: updated,
            };
        } catch (error) {
            this.logger.error(error);

            throw new BadRequestException('Failed to update role');
        }
    }

    async remove(id: number) {
        try {
            const role = await this.findOne(id);

            if (role.users?.length) {
                throw new BadRequestException(
                    'Cannot delete role assigned to users',
                );
            }

            await this.roleRepo.remove(role);

            this.logger.log(`Role deleted: ${id}`);

            return {
                message: 'Role deleted successfully',
            };
        } catch (error) {
            this.logger.error(error);

            if (
                error instanceof BadRequestException ||
                error instanceof NotFoundException
            ) {
                throw error;
            }

            throw new BadRequestException('Failed to delete role');
        }
    }
}