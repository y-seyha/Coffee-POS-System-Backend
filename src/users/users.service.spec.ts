import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../common/entities/user.entity';
import { Role } from '../common/entities/roles.entity';
import { StaffProfile } from '../common/entities/staff_profile.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock bcrypt to avoid read-only property redefine issues in Jest
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  let userRepoMock: any;
  let roleRepoMock: any;
  let staffRepoMock: any;
  let mockEntityManager: any;

  const mockUser = () => ({
    id: 1,
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedPassword',
    phone: '1234567890',
    role: { id: 2, name: 'CASHIER' },
    is_active: true,
    staffProfile: {
      id: 5,
      employee_code: 'EMP001',
      position: 'CASHIER',
      salary: '1000.00',
      address: 'Phnom Penh',
    },
  });

  const mockAdminUser = () => ({
    id: 2,
    email: 'admin@example.com',
    name: 'Admin User',
    password: 'hashedPassword',
    phone: '0987654321',
    role: { id: 1, name: 'ADMIN' },
    is_active: true,
    staffProfile: null,
  });

  const mockRole = () => ({
    id: 2,
    name: 'CASHIER',
    description: 'Cashier Role',
  });

  const mockAdminRole = () => ({
    id: 1,
    name: 'ADMIN',
    description: 'Admin Role',
  });

  beforeEach(async () => {
    // Define repo mocks
    userRepoMock = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    roleRepoMock = {
      findOne: jest.fn(),
    };

    staffRepoMock = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    // Configure mocked EntityManager for transactions
    mockEntityManager = {
      getRepository: jest.fn().mockImplementation((entity) => {
        if (entity === User) return userRepoMock;
        if (entity === Role) return roleRepoMock;
        if (entity === StaffProfile) return staffRepoMock;
      }),
    };

    // Mock transaction behavior on repository's manager property
    userRepoMock.manager = {
      transaction: jest.fn().mockImplementation((cb) => cb(mockEntityManager)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepoMock,
        },
        {
          provide: getRepositoryToken(Role),
          useValue: roleRepoMock,
        },
        {
          provide: getRepositoryToken(StaffProfile),
          useValue: staffRepoMock,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    it('should create an ADMIN user successfully without creating a StaffProfile', async () => {
      const createDto = {
        email: 'admin@example.com',
        password: 'password123',
        name: 'Admin User',
        phone: '0987654321',
        role_id: 1,
      };

      roleRepoMock.findOne.mockResolvedValue(mockAdminRole());
      userRepoMock.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      userRepoMock.create.mockReturnValue(mockAdminUser());
      userRepoMock.save.mockResolvedValue(mockAdminUser());

      const result = await service.create(createDto);

      expect(roleRepoMock.findOne).toHaveBeenCalledWith({ where: { id: createDto.role_id } });
      expect(userRepoMock.findOne).toHaveBeenCalledWith({ where: { email: createDto.email } });
      expect(bcrypt.hash).toHaveBeenCalledWith(createDto.password, 10);
      expect(userRepoMock.create).toHaveBeenCalled();
      expect(userRepoMock.save).toHaveBeenCalled();
      expect(staffRepoMock.create).not.toHaveBeenCalled();
      expect(result).toEqual({
        message: 'User created successfully',
        data: mockAdminUser(),
      });
    });

    it('should create a non-ADMIN user successfully along with a StaffProfile', async () => {
      const createDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        phone: '1234567890',
        role_id: 2,
        employee_code: 'EMP001',
        position: 'CASHIER',
        salary: 1000,
        address: 'Phnom Penh',
      };

      roleRepoMock.findOne.mockResolvedValue(mockRole());
      userRepoMock.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      userRepoMock.create.mockReturnValue(mockUser());
      userRepoMock.save.mockResolvedValue(mockUser());
      staffRepoMock.create.mockReturnValue(mockUser().staffProfile);
      staffRepoMock.save.mockResolvedValue(mockUser().staffProfile);

      const result = await service.create(createDto);

      expect(roleRepoMock.findOne).toHaveBeenCalled();
      expect(userRepoMock.create).toHaveBeenCalled();
      expect(userRepoMock.save).toHaveBeenCalled();
      expect(staffRepoMock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          employee_code: 'EMP001',
          position: 'CASHIER',
        }),
      );
      expect(staffRepoMock.save).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'User created successfully',
        data: mockUser(),
      });
    });

    it('should throw NotFoundException if role is not found', async () => {
      const createDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        phone: '1234567890',
        role_id: 999,
      };

      roleRepoMock.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(
        new NotFoundException('Role not found'),
      );
    });

    it('should throw BadRequestException if email already exists', async () => {
      const createDto = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        phone: '1234567890',
        role_id: 2,
      };

      roleRepoMock.findOne.mockResolvedValue(mockRole());
      userRepoMock.findOne.mockResolvedValue(mockUser());

      await expect(service.create(createDto)).rejects.toThrow(
        new BadRequestException('Email already exists'),
      );
    });
  });

  describe('findAll()', () => {
    it('should return a list of users with roles and profiles', async () => {
      userRepoMock.find.mockResolvedValue([mockUser(), mockAdminUser()]);

      const result = await service.findAll();

      expect(userRepoMock.find).toHaveBeenCalledWith({
        relations: ['role', 'staffProfile'],
        order: { id: 'DESC' },
      });
      expect(result).toEqual([mockUser(), mockAdminUser()]);
    });
  });

  describe('findOne()', () => {
    it('should return user by id if found', async () => {
      userRepoMock.findOne.mockResolvedValue(mockUser());

      const result = await service.findOne(1);

      expect(userRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['role', 'staffProfile'],
      });
      expect(result).toEqual(mockUser());
    });

    it('should throw NotFoundException if user is not found', async () => {
      userRepoMock.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });
  });

  describe('update()', () => {
    const updateDto = {
      name: 'Updated Name',
      phone: '1112223333',
      role_id: 2,
    };

    it('should update user name, phone, and role successfully', async () => {
      const existingUser = mockUser();
      userRepoMock.findOne.mockResolvedValue(existingUser);
      roleRepoMock.findOne.mockResolvedValue(mockRole());
      userRepoMock.save.mockResolvedValue({
        ...existingUser,
        name: 'Updated Name',
        phone: '1112223333',
      });
      staffRepoMock.findOne.mockResolvedValue(existingUser.staffProfile);
      staffRepoMock.save.mockResolvedValue(existingUser.staffProfile);

      const result = await service.update(1, updateDto);

      expect(userRepoMock.findOne).toHaveBeenCalled();
      expect(roleRepoMock.findOne).toHaveBeenCalled();
      expect(userRepoMock.save).toHaveBeenCalled();
      expect(staffRepoMock.findOne).toHaveBeenCalled();
      expect(staffRepoMock.save).toHaveBeenCalled();
      expect(result.message).toBe('User updated successfully');
    });

    it('should skip staffProfile synchronization for ADMIN roles', async () => {
      const existingAdmin = mockAdminUser();
      userRepoMock.findOne.mockResolvedValue(existingAdmin);
      userRepoMock.save.mockResolvedValue({
        ...existingAdmin,
        name: 'Updated Name',
      });

      const result = await service.update(2, { name: 'Updated Name' });

      expect(userRepoMock.save).toHaveBeenCalled();
      expect(staffRepoMock.findOne).not.toHaveBeenCalled();
      expect(staffRepoMock.save).not.toHaveBeenCalled();
      expect(result.message).toBe('User updated successfully');
    });

    it('should throw NotFoundException if user is not found', async () => {
      userRepoMock.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });

    it('should throw BadRequestException if new email is already taken by another user', async () => {
      userRepoMock.findOne.mockResolvedValueOnce(mockUser()); // finding the user to update
      userRepoMock.findOne.mockResolvedValueOnce({ id: 2, email: 'new@example.com' }); // duplicate email lookup

      await expect(service.update(1, { email: 'new@example.com' })).rejects.toThrow(
        new BadRequestException('Email already exists'),
      );
    });
  });

  describe('remove()', () => {
    it('should delete user successfully if found', async () => {
      userRepoMock.findOne.mockResolvedValue(mockUser());
      userRepoMock.remove.mockResolvedValue(mockUser());

      const result = await service.remove(1);

      expect(userRepoMock.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(userRepoMock.remove).toHaveBeenCalled();
      expect(result).toEqual({ message: 'User deleted successfully' });
    });

    it('should throw NotFoundException if user is not found', async () => {
      userRepoMock.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });
  });

  describe('toggleStatus()', () => {
    it('should deactivate user when is_active is true', async () => {
      userRepoMock.findOne.mockResolvedValue({
        ...mockUser(),
        is_active: true,
      });
      userRepoMock.save.mockResolvedValue(mockUser());

      const result = await service.toggleStatus(1);

      expect(userRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: false }),
      );
      expect(result).toEqual({ message: 'User deactivated' });
    });

    it('should activate user when is_active is false', async () => {
      userRepoMock.findOne.mockResolvedValue({
        ...mockUser(),
        is_active: false,
      });
      userRepoMock.save.mockResolvedValue(mockUser());

      const result = await service.toggleStatus(1);

      expect(userRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: true }),
      );
      expect(result).toEqual({ message: 'User activated' });
    });
  });

  describe('changeRole()', () => {
    it('should change user role and update staffProfile position successfully', async () => {
      const user = mockUser(); // role: CASHIER
      userRepoMock.findOne.mockResolvedValue(user);
      roleRepoMock.findOne.mockResolvedValue(mockAdminRole());
      userRepoMock.save.mockResolvedValue(user);
      staffRepoMock.save.mockResolvedValue(user.staffProfile);

      const result = await service.changeRole(1, 1);

      expect(userRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['staffProfile'],
      });
      expect(roleRepoMock.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(userRepoMock.save).toHaveBeenCalled();
      expect(staffRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ position: 'ADMIN' }),
      );
      expect(result).toEqual({ message: 'Role updated successfully' });
    });

    it('should throw NotFoundException if user is not found', async () => {
      userRepoMock.findOne.mockResolvedValue(null);

      await expect(service.changeRole(999, 1)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });

    it('should throw NotFoundException if role is not found', async () => {
      userRepoMock.findOne.mockResolvedValue(mockUser());
      roleRepoMock.findOne.mockResolvedValue(null);

      await expect(service.changeRole(1, 999)).rejects.toThrow(
        new NotFoundException('Role not found'),
      );
    });
  });

  describe('resetPassword()', () => {
    it('should hash and save the new password successfully', async () => {
      userRepoMock.findOne.mockResolvedValue(mockUser());
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');
      userRepoMock.save.mockResolvedValue(mockUser());

      const result = await service.resetPassword(1, 'newPassword');

      expect(userRepoMock.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword', 10);
      expect(userRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'newHashedPassword' }),
      );
      expect(result).toEqual({ message: 'Password reset successfully' });
    });

    it('should throw NotFoundException if user is not found', async () => {
      userRepoMock.findOne.mockResolvedValue(null);

      await expect(service.resetPassword(999, 'newPassword')).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });
  });
});
