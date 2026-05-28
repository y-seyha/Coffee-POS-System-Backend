import {
    BadRequestException, ForbiddenException,
    Injectable, UnauthorizedException,
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
import {getCookieOptions} from "../utils/cookie_options";
import type {Response } from 'express';

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


        user.last_login_at = new Date();
        await this.userRepo.save(user);

        const tokens = this.generateToken(user);

        const hashedRefresh = await bcrypt.hash(tokens.refreshToken, 10);

        user.refresh_token_hash = hashedRefresh;

        await this.userRepo.save(user);

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

    async refresh(refreshToken: string, res: Response) {
        if (!refreshToken) {
            throw new UnauthorizedException('No refresh token');
        }

        let payload: any;

        try {
            payload = this.jwtService.verify(refreshToken, {
                secret: process.env.JWT_REFRESH_SECRET,
            });
        } catch {
            throw new UnauthorizedException('Invalid refresh token');
        }

        const user = await this.userRepo.findOne({
            where: { id: payload.userId },
            relations: ['role'],
        });

        if (!user || !user.is_active) {
            throw new UnauthorizedException('User not valid');
        }

        const isValid = await bcrypt.compare(
            refreshToken,
            user.refresh_token_hash || ''
        );

        if (!isValid) {
            throw new UnauthorizedException('Refresh token revoked');
        }


        const tokens = this.generateToken(user);

        user.refresh_token_hash = await bcrypt.hash(tokens.refreshToken, 10);

        await this.userRepo.save(user);

        res.cookie('access_token', tokens.accessToken, {
            ...getCookieOptions(),
            maxAge: 15 * 60 * 1000,
        });

        res.cookie('refresh_token', tokens.refreshToken, {
            ...getCookieOptions(),
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return {
            message: 'Token refreshed',
            accessToken: tokens.accessToken,
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
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role?.name,
        };

        const accessToken = this.jwtService.sign(payload, {
            secret: process.env.JWT_ACCESS_SECRET,
            expiresIn: '15m',
        });

        const refreshToken = this.jwtService.sign(payload, {
            secret: process.env.JWT_REFRESH_SECRET,
            expiresIn: '7d',
        });

        return { accessToken, refreshToken };
    }

    async logout(userId: number, res: Response) {
        const user = await this.userRepo.findOne({
            where: { id: userId },
        });

        if (user) {
            //  invalidate refresh token
            user.refresh_token_hash = null;
            await this.userRepo.save(user);
        }

        // clear cookies
        res.clearCookie('access_token', getCookieOptions());
        res.clearCookie('refresh_token', getCookieOptions());

        return {
            message: 'Logout successful',
        };
    }
}