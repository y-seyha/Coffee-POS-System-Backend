import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Post, Req,
    Res,
    UseGuards,
} from '@nestjs/common';

import {
    ApiBearerAuth,
    ApiBody,
    ApiCookieAuth,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';

// import type {  Response } from 'express';

import { AuthService } from './auth.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify_email.dto';
import {getCookieOptions} from "../utils/cookie_options";
import {ResendVerificationDto} from "./dto/resend_verify_email.dto";
import {JwtAuthGuard} from "./guard/jwt-auth.guard";
import {CurrentUser} from "./decorator/current_user.decorator";
import {LoginThrottlerGuard} from "./guard/login-throttler.guard";
import type { Request, Response } from 'express';


@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
    ) {}

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Register new user account',
    })
    @ApiBody({
        type: RegisterDto,
    })
    @ApiResponse({
        status: 201,
        description:
            'User registered successfully',
    })
    @ApiResponse({
        status: 400,
        description:
            'Invalid input or email already exists',
    })
    async register(
        @Body() dto: RegisterDto,
    ) {
        return await this.authService.register(dto);
    }


    @Post('login')
    @UseGuards(LoginThrottlerGuard)
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Login user account',
    })
    @ApiBody({
        type: LoginDto,
    })
    @ApiResponse({
        status: 200,
        description: 'Login successful',
    })
    @ApiResponse({
        status: 400,
        description: 'Invalid credentials',
    })
    @ApiResponse({
        status: 403,
        description:
            'Email not verified',
    })
    async login(
        @Body() dto: LoginDto,
        @Res({ passthrough: true })
        res: Response,
    ) {
        const result =
            await this.authService.login(dto);

        res.cookie(
            'access_token',
            result.accessToken,
            {...getCookieOptions(), maxAge: 15 * 60 * 1000,},
        );

        res.cookie('refresh_token', result.refreshToken,
            {...getCookieOptions(), maxAge: 7 * 24 * 60 * 60 * 1000,},
        );

        return result;
    }

    @Post('verify-email')
    @HttpCode(HttpStatus.OK)

    @ApiOperation({
        summary: 'Verify user email',
    })

    @ApiBody({
        type: VerifyEmailDto,
    })

    @ApiResponse({
        status: 200,
        description:
            'Email verified successfully',
    })

    @ApiResponse({
        status: 400,
        description:
            'Invalid or expired token',
    })
    async verifyEmail(
        @Body() dto: VerifyEmailDto,
        @Res({ passthrough: true })
        res: Response,
    ) {
        const result =
            await this.authService.verifyEmail(dto);

        res.cookie('access_token', result.accessToken, {...getCookieOptions(), maxAge: 15 * 60 * 1000,},);
        res.cookie(
            'refresh_token',
            result.refreshToken,
            {...getCookieOptions(), maxAge: 7 * 24 * 60 * 60 * 1000,},);

        return result;
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const token = req.cookies?.refresh_token;

        return this.authService.refresh(token, res);
    }


    @Post('resend-verification-email')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary:
            'Resend verification email',
    })
    @ApiBody({
        type: ResendVerificationDto,
    })
    @ApiResponse({
        status: 200,
        description:
            'Verification email resent successfully',
    })
    @ApiResponse({
        status: 400,
        description:
            'User not found or already verified',
    })
    async resendVerificationEmail(
        @Body()
        dto: ResendVerificationDto,
    ) {
        return await this.authService.resendVerificationEmail(
            dto.email,
        );
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiCookieAuth()
    @ApiOperation({
        summary:
            'Get currently authenticated user',
    })
    @ApiResponse({
        status: 200,
        description:
            'Current authenticated user',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized',
    })
    async me(
        @CurrentUser()
        user: any,
    ) {
        return {
            user,
        };
    }


    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Logout current user',
    })
    @ApiResponse({
        status: 200,
        description: 'Logout successful',
    })
    @UseGuards(JwtAuthGuard)
    async logout(
        @CurrentUser() user: any,
        @Res({ passthrough: true }) res: Response,
    ) {
        return this.authService.logout(user.userId, res);
    }
}