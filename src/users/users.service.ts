import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User } from '../common/entities/user.entity';
import { Role } from '../common/entities/roles.entity';
import {Position, StaffProfile} from '../common/entities/staff_profile.entity';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {FilterUsersDto} from "./dto/filter-users.dto";

@Injectable()
export class UsersService {
    private readonly logger = new Logger(UsersService.name);

    constructor(
        @InjectRepository(User)
        private userRepo: Repository<User>,

        @InjectRepository(Role)
        private roleRepo: Repository<Role>,

        @InjectRepository(StaffProfile)
        private staffRepo: Repository<StaffProfile>,
    ) {}

    async create(dto: CreateUserDto) {
        this.logger.log(`Creating user: ${dto.email}`);

        try {
            return await this.userRepo.manager.transaction(async (manager) => {
                const userRepo = manager.getRepository(User);
                const roleRepo = manager.getRepository(Role);
                const staffRepo = manager.getRepository(StaffProfile);

                const role = await roleRepo.findOne({
                    where: { id: dto.role_id },
                });

                if (!role) {
                    throw new NotFoundException('Role not found');
                }

                const existing = await userRepo.findOne({
                    where: { email: dto.email },
                });

                if (existing) {
                    throw new BadRequestException('Email already exists');
                }

                const hashedPassword = await bcrypt.hash(dto.password, 10);

                const user = userRepo.create({
                    email: dto.email,
                    name: dto.name,
                    password: hashedPassword,
                    phone: dto.phone,
                    role,
                });

                const savedUser = await userRepo.save(user);

                // CREATE STAFF PROFILE (only non-admin)
                if (role.name !== 'ADMIN') {
                    await this.createStaffIfRequired(
                        staffRepo,
                        savedUser,
                        dto,
                    );
                }

                this.logger.log(`User created: ${savedUser.id}`);

                return {
                    message: 'User created successfully',
                    data: savedUser,
                };
            });
        } catch (error) {
            this.logger.error(`Create user failed: ${error.message}`);
            throw error;
        }
    }

    // async findAll() {
    //     try {
    //         return await this.userRepo.find({
    //             relations: ['role', 'staffProfile'],
    //             order: { id: 'DESC' },
    //         });
    //     } catch (error) {
    //         this.logger.error(`FindAll failed: ${error.message}`);
    //         throw error;
    //     }
    // }

    async findAll(query: FilterUsersDto) {
        try {
            const {
                search,
                role,
                is_active,
                sortBy = 'created_at',
                order = 'DESC',
                page = '1',
                limit = '10',
            } = query;

            const qb = this.userRepo
                .createQueryBuilder('user')
                .leftJoinAndSelect('user.role', 'role')
                .leftJoinAndSelect('user.staffProfile', 'staffProfile');

            // SEARCH
            if (search) {
                qb.andWhere(
                    `
                (
                    LOWER(user.name) LIKE LOWER(:search)
                    OR LOWER(user.email) LIKE LOWER(:search)
                    OR LOWER(user.phone) LIKE LOWER(:search)
                    OR LOWER(role.name) LIKE LOWER(:search)
                    OR LOWER(staffProfile.employee_code) LIKE LOWER(:search)
                )
                `,
                    {
                        search: `%${search}%`,
                    },
                );
            }

            // ROLE FILTER
            if (role) {
                qb.andWhere('role.name = :role', {
                    role,
                });
            }

            // STATUS FILTER
            if (is_active !== undefined) {
                qb.andWhere('user.is_active = :is_active', {
                    is_active: is_active === 'true',
                });
            }

            /**
             * SORTABLE FIELD MAP
             */
            const sortableFields: Record<string, string> = {
                id: 'user.id',
                name: 'user.name',
                email: 'user.email',
                phone: 'user.phone',
                created_at: 'user.created_at',
                updated_at: 'user.updated_at',
                is_active: 'user.is_active',
                last_login_at: 'user.last_login_at',

                role: 'role.name',

                employee_code: 'staffProfile.employee_code',
                position: 'staffProfile.position',
                salary: 'staffProfile.salary',
                hire_date: 'staffProfile.hire_date',
            };

            const sortField =
                sortableFields[sortBy] || sortableFields.created_at;

            qb.orderBy(sortField, order);

            // PAGINATION
            const take = Number(limit);
            const skip = (Number(page) - 1) * take;

            qb.skip(skip).take(take);

            const [users, total] = await qb.getManyAndCount();

            return {
                data: users,
                meta: {
                    total,
                    page: Number(page),
                    limit: take,
                    totalPages: Math.ceil(total / take),

                    sortBy,
                    order,
                },
            };
        } catch (error) {
            this.logger.error(`FindAll failed: ${error.message}`);
            throw error;
        }
    }

    async findOne(id: number) {
        try {
            const user = await this.userRepo.findOne({
                where: { id },
                relations: ['role', 'staffProfile'],
            });

            if (!user) throw new NotFoundException('User not found');

            return user;
        } catch (error) {
            this.logger.error(`FindOne failed: ${error.message}`);
            throw error;
        }
    }

    async update(id: number, dto: UpdateUserDto) {
        this.logger.log(`Updating user: ${id}`);

        try {
            return await this.userRepo.manager.transaction(async (manager) => {
                const userRepo = manager.getRepository(User);
                const roleRepo = manager.getRepository(Role);
                const staffRepo = manager.getRepository(StaffProfile);

                const user = await userRepo.findOne({
                    where: { id },
                    relations: ['role'],
                });

                if (!user) throw new NotFoundException('User not found');

                // update email
                if (dto.email !== undefined) {
                    const existing = await userRepo.findOne({
                        where: { email: dto.email },
                    });

                    if (existing && existing.id !== id) {
                        throw new BadRequestException('Email already exists');
                    }

                    user.email = dto.email;
                }

                if (dto.name !== undefined) user.name = dto.name;
                if (dto.phone !== undefined) user.phone = dto.phone;


                const updatedUser = await userRepo.save(user);

                // sync staff
                await this.syncStaffProfile(staffRepo, updatedUser, dto);

                this.logger.log(`User updated: ${id}`);

                return {
                    message: 'User updated successfully',
                    data: updatedUser,
                };
            });
        } catch (error) {
            this.logger.error(`Update failed: ${error.message}`);
            throw error;
        }
    }

    async remove(id: number) {
        this.logger.log(`Deleting user: ${id}`);

        try {
            const user = await this.userRepo.findOne({
                where: { id },
            });

            if (!user) throw new NotFoundException('User not found');

            await this.userRepo.remove(user);

            return {
                message: 'User deleted successfully',
            };
        } catch (error) {
            this.logger.error(`Delete failed: ${error.message}`);
            throw error;
        }
    }

    async toggleStatus(id: number) {
        try {
            const user = await this.userRepo.findOne({ where: { id } });

            if (!user) throw new NotFoundException('User not found');

            user.is_active = !user.is_active;

            await this.userRepo.save(user);

            return {
                message: `User ${
                    user.is_active ? 'activated' : 'deactivated'
                }`,
            };
        } catch (error) {
            this.logger.error(`Toggle status failed: ${error.message}`);
            throw error;
        }
    }

    async changeRole(userId: number, roleId: number) {
        try {
            const user = await this.userRepo.findOne({
                where: { id: userId },
                relations: ['staffProfile'], // IMPORTANT
            });

            if (!user) throw new NotFoundException('User not found');

            const role = await this.roleRepo.findOne({
                where: { id: roleId },
            });

            if (!role) throw new NotFoundException('Role not found');

            // update role
            user.role = role;
            await this.userRepo.save(user);

            // SYNC POSITION WITH ROLE NAME
            if (user.staffProfile) {
                await this.staffRepo.save(user.staffProfile);
            }

            return { message: 'Role updated successfully' };
        } catch (error) {
            this.logger.error(error.message);
            throw error;
        }
    }

    async resetPassword(userId: number, newPassword: string) {
        try {
            const user = await this.userRepo.findOne({ where: { id: userId } });

            if (!user) throw new NotFoundException('User not found');

            user.password = await bcrypt.hash(newPassword, 10);

            await this.userRepo.save(user);

            return { message: 'Password reset successfully' };
        } catch (error) {
            this.logger.error(`Reset password failed: ${error.message}`);
            throw error;
        }
    }


    private async createStaffIfRequired(
        staffRepo: Repository<StaffProfile>,
        user: User,
        dto: CreateUserDto,
    ) {
        const employee_code = await this.generateEmployeeCode(staffRepo);

        const staff = staffRepo.create({
            employee_code,
            position: dto.position ?? Position.CASHIER,
            hire_date: dto.hire_date ? new Date(dto.hire_date) : new Date(),
            salary: this.normalizeSalary(dto.salary),
            address: dto.address ?? '',
            user: { id: user.id },
        });

        await staffRepo.save(staff);
    }

    private async syncStaffProfile(
        staffRepo: Repository<StaffProfile>,
        user: User,
        dto: UpdateUserDto,
    ) {
        if (user.role.name === 'ADMIN') return;

        let staff = await staffRepo.findOne({
            where: { user: { id: user.id } },
        });

        if (!staff) {
            staff = staffRepo.create({
                user: { id: user.id },
            });
        }

        if (dto.hire_date)
            staff.hire_date = new Date(dto.hire_date);
        if (dto.salary) staff.salary = dto.salary.toString();
        if (dto.address) staff.address = dto.address;

        await staffRepo.save(staff);
    }

    private normalizeSalary(salary?: number): string | undefined {
        return salary !== undefined ? salary.toFixed(2) : undefined;
    }

    private async generateEmployeeCode(staffRepo: Repository<StaffProfile>) {
        const last = await staffRepo
            .createQueryBuilder("staff")
            .orderBy("staff.id", "DESC")
            .getOne();

        const nextId = (last?.id ?? 0) + 1;
        return `EMP-${String(nextId).padStart(3, "0")}`;
    }

    private mapRoleToPosition(role: string): Position {
        switch (role) {
            case 'ADMIN':
                return Position.MANAGER;
            case 'STAFF':
                return Position.CASHIER;
            default:
                return Position.CASHIER;
        }
    }
}