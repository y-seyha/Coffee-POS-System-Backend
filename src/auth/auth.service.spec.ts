import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../common/entities/user.entity';
import { Role } from '../common/entities/roles.entity';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '../utils/mailer';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import crypto from 'crypto';

// Properly mock bcrypt and crypto modules to avoid "Cannot redefine property" errors on read-only exports
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'),
  randomBytes: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let userRepoMock: any;
  let roleRepoMock: any;
  let jwtServiceMock: any;
  let mailerServiceMock: any;

  const mockUser = () => ({
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword',
    phone: '1234567890',
    is_active: false,
    role: { id: 2, name: 'CASHIER' },
    email_verification_token: 'mock-token',
    email_verification_expires: new Date(Date.now() + 60 * 60 * 1000),
  });

  const mockRole = () => ({
    id: 2,
    name: 'CASHIER',
    description: 'Cashier Role',
  });

  beforeEach(async () => {
    // Define repository and service mocks
    userRepoMock = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    roleRepoMock = {
      findOne: jest.fn(),
    };

    jwtServiceMock = {
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
    };

    mailerServiceMock = {
      sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepoMock,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: roleRepoMock,
        },
        {
          provide: JwtService,
          useValue: jwtServiceMock,
        },
        {
          provide: MailerService,
          useValue: mailerServiceMock,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register()', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      phone: '1234567890',
      roleId: 2,
    };

    it('should register a new user successfully and send a verification email', async () => {
      roleRepoMock.findOne.mockResolvedValue(mockRole());
      userRepoMock.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (crypto.randomBytes as jest.Mock).mockReturnValue({
        toString: () => 'mock-token',
      } as any);
      userRepoMock.create.mockReturnValue(mockUser());
      userRepoMock.save.mockResolvedValue(mockUser());

      const result = await service.register(registerDto);

      expect(roleRepoMock.findOne).toHaveBeenCalledWith({ where: { id: registerDto.roleId } });
      expect(userRepoMock.findOne).toHaveBeenCalledWith({
        where: { email: registerDto.email },
        relations: ['role'],
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(userRepoMock.create).toHaveBeenCalled();
      expect(userRepoMock.save).toHaveBeenCalled();
      expect(mailerServiceMock.sendVerificationEmail).toHaveBeenCalledWith(
        registerDto.email,
        'mock-token',
      );
      expect(result).toEqual({
        message: 'Registration successful. Please verify your email.',
      });
    });

    it('should throw BadRequestException if role is not found', async () => {
      roleRepoMock.findOne.mockResolvedValue(null);

      await expect(service.register(registerDto)).rejects.toThrow(
        new BadRequestException('Invalid role'),
      );

      expect(roleRepoMock.findOne).toHaveBeenCalled();
      expect(userRepoMock.findOne).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if email already exists and is active', async () => {
      roleRepoMock.findOne.mockResolvedValue(mockRole());
      userRepoMock.findOne.mockResolvedValue({
        ...mockUser(),
        is_active: true,
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        new BadRequestException('Email already exists'),
      );

      expect(userRepoMock.findOne).toHaveBeenCalled();
      expect(userRepoMock.save).not.toHaveBeenCalled();
    });

    it('should resend verification, update user details and return notice if email exists but is unverified', async () => {
      roleRepoMock.findOne.mockResolvedValue(mockRole());
      const existingUnverifiedUser = mockUser();
      userRepoMock.findOne.mockResolvedValue(existingUnverifiedUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (crypto.randomBytes as jest.Mock).mockReturnValue({
        toString: () => 'new-mock-token',
      } as any);
      userRepoMock.save.mockResolvedValue({
        ...existingUnverifiedUser,
        email_verification_token: 'new-mock-token',
      });

      const result = await service.register(registerDto);

      expect(userRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email_verification_token: 'new-mock-token',
        }),
      );
      expect(mailerServiceMock.sendVerificationEmail).toHaveBeenCalledWith(
        existingUnverifiedUser.email,
        'new-mock-token',
      );
      expect(result).toEqual({
        message: 'Account already exists but is not verified. Verification email resent.',
      });
    });
  });

  describe('login()', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should return accessToken + refreshToken and user info on valid credentials', async () => {
      const activeUser = {
        ...mockUser(),
        is_active: true,
      };
      userRepoMock.findOne.mockResolvedValue(activeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(userRepoMock.findOne).toHaveBeenCalled();
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, activeUser.password);
      expect(jwtServiceMock.sign).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        message: 'Login successful',
        accessToken: 'mock-jwt-token',
        refreshToken: 'mock-jwt-token',
        user: {
          id: activeUser.id,
          email: activeUser.email,
          name: activeUser.name,
          role: activeUser.role.name,
        },
      });
    });

    it('should throw BadRequestException if user is not found', async () => {
      userRepoMock.findOne.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        new BadRequestException('Invalid credentials'),
      );
    });

    it('should throw BadRequestException if password is incorrect', async () => {
      userRepoMock.findOne.mockResolvedValue(mockUser());
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        new BadRequestException('Invalid credentials'),
      );
    });

    it('should throw ForbiddenException if user email is not verified', async () => {
      const inactiveUser = mockUser(); // is_active = false
      userRepoMock.findOne.mockResolvedValue(inactiveUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login(loginDto)).rejects.toThrow(
        new ForbiddenException('Please verify your email first'),
      );
    });
  });

  describe('verifyEmail()', () => {
    const verifyDto = { token: 'mock-token' };

    it('should activate user and return tokens when token is valid', async () => {
      const inactiveUser = mockUser();
      userRepoMock.findOne.mockResolvedValue(inactiveUser);
      userRepoMock.save.mockResolvedValue({
        ...inactiveUser,
        is_active: true,
        email_verification_token: null,
      });

      const result = await service.verifyEmail(verifyDto);

      expect(userRepoMock.findOne).toHaveBeenCalledWith({
        where: { email_verification_token: verifyDto.token },
        relations: ['role'],
      });
      expect(userRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: true,
          email_verification_token: null,
        }),
      );
      expect(result).toEqual({
        message: 'Email verified successfully',
        accessToken: 'mock-jwt-token',
        refreshToken: 'mock-jwt-token',
      });
    });

    it('should throw BadRequestException if token is not found', async () => {
      userRepoMock.findOne.mockResolvedValue(null);

      await expect(service.verifyEmail(verifyDto)).rejects.toThrow(
        new BadRequestException('Invalid or expired token'),
      );
    });

    it('should throw BadRequestException if token is expired', async () => {
      const expiredUser = {
        ...mockUser(),
        email_verification_expires: new Date(Date.now() - 1000), // in the past
      };
      userRepoMock.findOne.mockResolvedValue(expiredUser);

      await expect(service.verifyEmail(verifyDto)).rejects.toThrow(
        new BadRequestException('Token expired'),
      );
    });
  });

  describe('resendVerificationEmail()', () => {
    const email = 'test@example.com';

    it('should generate new token and resend verification email successfully', async () => {
      const inactiveUser = mockUser();
      userRepoMock.findOne.mockResolvedValue(inactiveUser);
      (crypto.randomBytes as jest.Mock).mockReturnValue({
        toString: () => 'new-token',
      } as any);
      userRepoMock.save.mockResolvedValue({
        ...inactiveUser,
        email_verification_token: 'new-token',
      });

      const result = await service.resendVerificationEmail(email);

      expect(userRepoMock.findOne).toHaveBeenCalledWith({ where: { email } });
      expect(userRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email_verification_token: 'new-token',
        }),
      );
      expect(mailerServiceMock.sendVerificationEmail).toHaveBeenCalledWith(
        email,
        'new-token',
      );
      expect(result).toEqual({
        message: 'Verification email resent successfully',
      });
    });

    it('should throw BadRequestException if user is not found', async () => {
      userRepoMock.findOne.mockResolvedValue(null);

      await expect(service.resendVerificationEmail(email)).rejects.toThrow(
        new BadRequestException('User not found'),
      );
    });

    it('should throw BadRequestException if user is already verified', async () => {
      const verifiedUser = {
        ...mockUser(),
        is_active: true,
      };
      userRepoMock.findOne.mockResolvedValue(verifiedUser);

      await expect(service.resendVerificationEmail(email)).rejects.toThrow(
        new BadRequestException('Email already verified'),
      );
    });
  });
});
