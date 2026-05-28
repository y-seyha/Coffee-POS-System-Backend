import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import { LoginThrottlerGuard } from './guard/login-throttler.guard';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Response } from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: any;
  let resMock: Partial<Response>;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    verifyEmail: jest.fn(),
    resendVerificationEmail: jest.fn(),
  };

  beforeEach(async () => {
    resMock = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      // Override guards completely to isolate controller tests
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(LoginThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register()', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      phone: '1234567890',
      roleId: 2,
    };

    it('should register a new user successfully', async () => {
      const mockResult = { message: 'Registration successful. Please verify your email.' };
      authService.register.mockResolvedValue(mockResult);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockResult);
    });

    it('should forward service registration exceptions', async () => {
      authService.register.mockRejectedValue(new BadRequestException('Invalid role'));

      await expect(controller.register(registerDto)).rejects.toThrow(
        new BadRequestException('Invalid role'),
      );
    });
  });

  describe('login()', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login, set cookies, and return auth details', async () => {
      const mockResult = {
        message: 'Login successful',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: 1, email: 'test@example.com', name: 'Test', role: 'CASHIER' },
      };
      authService.login.mockResolvedValue(mockResult);

      const result = await controller.login(loginDto, resMock as Response);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(resMock.cookie).toHaveBeenCalledTimes(2);
      expect(resMock.cookie).toHaveBeenCalledWith(
        'access_token',
        'access-token',
        expect.any(Object),
      );
      expect(resMock.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'refresh-token',
        expect.any(Object),
      );
      expect(result).toEqual(mockResult);
    });

    // Custom helper helper since we are testing both normal mock and expect.any
    function testCookieCall(name: string, value: string) {
      expect(resMock.cookie).toHaveBeenCalledWith(name, value, expect.any(Object));
    }

    it('should check cookie options and login successfully', async () => {
      const mockResult = {
        message: 'Login successful',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: 1, email: 'test@example.com', name: 'Test', role: 'CASHIER' },
      };
      authService.login.mockResolvedValue(mockResult);

      await controller.login(loginDto, resMock as Response);

      testCookieCall('access_token', 'access-token');
      testCookieCall('refresh_token', 'refresh-token');
    });

    it('should forward login validation exceptions', async () => {
      authService.login.mockRejectedValue(new BadRequestException('Invalid credentials'));

      await expect(controller.login(loginDto, resMock as Response)).rejects.toThrow(
        new BadRequestException('Invalid credentials'),
      );
    });

    it('should forward forbidden exceptions for unverified emails', async () => {
      authService.login.mockRejectedValue(new ForbiddenException('Please verify your email first'));

      await expect(controller.login(loginDto, resMock as Response)).rejects.toThrow(
        new ForbiddenException('Please verify your email first'),
      );
    });
  });

  describe('verifyEmail()', () => {
    const verifyDto = { token: 'verification-token' };

    it('should verify email, set cookies, and return verification status', async () => {
      const mockResult = {
        message: 'Email verified successfully',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      authService.verifyEmail.mockResolvedValue(mockResult);

      const result = await controller.verifyEmail(verifyDto, resMock as Response);

      expect(authService.verifyEmail).toHaveBeenCalledWith(verifyDto);
      expect(resMock.cookie).toHaveBeenCalledTimes(2);
      expect(resMock.cookie).toHaveBeenCalledWith('access_token', 'access-token', expect.any(Object));
      expect(resMock.cookie).toHaveBeenCalledWith('refresh_token', 'refresh-token', expect.any(Object));
      expect(result).toEqual(mockResult);
    });

    it('should forward verifyEmail exceptions', async () => {
      authService.verifyEmail.mockRejectedValue(new BadRequestException('Token expired'));

      await expect(controller.verifyEmail(verifyDto, resMock as Response)).rejects.toThrow(
        new BadRequestException('Token expired'),
      );
    });
  });

  describe('resendVerificationEmail()', () => {
    const resendDto = { email: 'test@example.com' };

    it('should request token resending successfully', async () => {
      const mockResult = { message: 'Verification email resent successfully' };
      authService.resendVerificationEmail.mockResolvedValue(mockResult);

      const result = await controller.resendVerificationEmail(resendDto);

      expect(authService.resendVerificationEmail).toHaveBeenCalledWith(resendDto.email);
      expect(result).toEqual(mockResult);
    });

    it('should forward resend exceptions', async () => {
      authService.resendVerificationEmail.mockRejectedValue(new BadRequestException('User not found'));

      await expect(controller.resendVerificationEmail(resendDto)).rejects.toThrow(
        new BadRequestException('User not found'),
      );
    });
  });

  describe('me()', () => {
    it('should return currently logged-in user info', async () => {
      const mockUser = { id: 1, email: 'test@example.com', name: 'Test', role: 'CASHIER' };

      const result = await controller.me(mockUser);

      expect(result).toEqual({ user: mockUser });
    });
  });

  describe('logout()', () => {
    it('should clear cookies and return a success message', async () => {
      const result = await controller.logout(resMock as Response);

      expect(resMock.clearCookie).toHaveBeenCalledTimes(2);
      expect(resMock.clearCookie).toHaveBeenCalledWith('access_token', expect.any(Object));
      expect(resMock.clearCookie).toHaveBeenCalledWith('refresh_token', expect.any(Object));
      expect(result).toEqual({ message: 'Logout successful' });
    });
  });
});
