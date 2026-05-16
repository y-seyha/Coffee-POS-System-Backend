import {
    BadRequestException, ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../common/entities/user.entity';
import { Role } from '../common/entities/roles.entity';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import crypto from 'crypto';
import {LoginDto} from "./dto/login.dto";
import {VerifyEmailDto} from "./dto/verify_email.dto";
import {MailerService} from "../utils/mailer";

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,

        @InjectRepository(Role)
        private readonly roleRepo: Repository<Role>,

        private readonly jwtService: JwtService,

        private readonly mailerService: MailerService,
    ) {}

    async register(dto: RegisterDto) {
        const { email, password, name, phone, roleId } = dto;

        const role = await this.roleRepo.findOne({
            where: { id: roleId },
        });

        if (!role) {
            throw new BadRequestException('Invalid role');
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const verificationToken = crypto.randomBytes(32).toString('hex');

        const verificationExpires = new Date(
            Date.now() + 60 * 60 * 1000,
        );

        let user = await this.userRepo.findOne({
            where: { email },
            relations: ['role'],
        });

        if (user) {
            if (user.is_active) {
                throw new BadRequestException(
                    'Email already exists',
                );
            }

            user.name = name;
            user.phone = phone;
            user.password = passwordHash;
            user.role = role;

            user.email_verification_token = verificationToken;
            user.email_verification_expires = verificationExpires;

            await this.userRepo.save(user);

            // resend verification email
            await this.mailerService.sendVerificationEmail(
                user.email,
                verificationToken,
            );

            return {
                message:
                    'Account already exists but is not verified. Verification email resent.',
            };
        }

        user = this.userRepo.create({
            email,
            name,
            phone,
            password: passwordHash,
            role,
            is_active: false,
            email_verification_token: verificationToken,
            email_verification_expires: verificationExpires,
        });

        await this.userRepo.save(user);

        await this.mailerService.sendVerificationEmail(
            user.email,
            verificationToken,
        );

        return {
            message:
                'Registration successful. Please verify your email.',
        };
    }

    async login(dto: LoginDto) {
        const user = await this.userRepo.findOne({
            where: { email: dto.email },
            relations: ['role'],
            select: {
                id: true,
                email: true,
                name: true,
                password: true,
                is_active: true,
                role: {
                    id: true,
                    name: true,
                },
            },
        });

        if (!user) {
            throw new BadRequestException('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(dto.password, user.password);

        if (!isMatch) {
            throw new BadRequestException('Invalid credentials');
        }

        if (!user.is_active) {
            throw new ForbiddenException('Please verify your email first');
        }

        const tokens = this.generateToken(user);

        return {
            message: 'Login successful',
            ...tokens,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role.name,
            },
        };
    }

    async verifyEmail(dto: VerifyEmailDto) {
        const user = await this.userRepo.findOne({
            where: {
                email_verification_token: dto.token,
            },
            relations: ['role'],
        });

        if (!user) {
            throw new BadRequestException('Invalid or expired token');
        }

        if (
            !user.email_verification_expires ||
            user.email_verification_expires < new Date()
        ) {
            throw new BadRequestException('Token expired');
        }

        user.is_active = true;
        user.email_verification_token = null;
        user.email_verification_expires = null;

        await this.userRepo.save(user);

        const tokens = this.generateToken(user);

        return {
            message: 'Email verified successfully',
            ...tokens,
        };
    }

    async resendVerificationEmail(email: string) {

        const user = await this.userRepo.findOne({
            where: { email },
        });

        if (!user) {
            throw new BadRequestException('User not found');
        }

        if (user.is_active) {
            throw new BadRequestException(
                'Email already verified',
            );
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');

        const verificationExpires = new Date(
            Date.now() + 60 * 60 * 1000,
        );

        user.email_verification_token = verificationToken;

        user.email_verification_expires =
            verificationExpires;

        await this.userRepo.save(user);

        await this.mailerService.sendVerificationEmail(
            user.email,
            verificationToken,
        );

        return {
            message:
                'Verification email resent successfully',
        };
    }

    private generateToken(user: User) {
        console.log('JWT SECRET USED:', process.env.JWT_SECRET);
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role?.name,
        };

        return {
            accessToken: this.jwtService.sign(payload, {
                expiresIn: '15m',
            }),

            refreshToken: this.jwtService.sign(payload, {
                expiresIn: '7d',
            }),
        };
    }
}