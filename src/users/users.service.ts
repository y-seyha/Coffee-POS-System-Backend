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
import { StaffProfile } from '../common/entities/staff_profile.entity';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

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

    async findAll() {
        try {
            return await this.userRepo.find({
                relations: ['role', 'staffProfile'],
                order: { id: 'DESC' },
            });
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

                // role update
                if (dto.role_id) {
                    const role = await roleRepo.findOne({
                        where: { id: dto.role_id },
                    });

                    if (!role) throw new NotFoundException('Role not found');

                    user.role = role;
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
                user.staffProfile.position = role.name;
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
        if (!dto.employee_code || !dto.position) {
            throw new BadRequestException(
                'Staff info required for non-admin users',
            );
        }

        const staff = staffRepo.create({
            employee_code: dto.employee_code,
            position: dto.position,
            hire_date: dto.hire_date ? new Date(dto.hire_date) : undefined,
            salary: this.normalizeSalary(dto.salary),
            address: dto.address,
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

        if (dto.employee_code) staff.employee_code = dto.employee_code;
        if (dto.position) staff.position = dto.position;
        if (dto.hire_date)
            staff.hire_date = new Date(dto.hire_date);
        if (dto.salary) staff.salary = dto.salary.toString();
        if (dto.address) staff.address = dto.address;

        await staffRepo.save(staff);
    }

    private normalizeSalary(salary?: number): string | undefined {
        return salary !== undefined ? salary.toFixed(2) : undefined;
    }
}