import { Test, TestingModule } from '@nestjs/testing';
import { RoleService } from './role.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Role } from '../common/entities/roles.entity';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';

describe('RoleService', () => {
  let service: RoleService;
  let roleRepoMock: any;

  const mockRole = () => ({
    id: 2,
    name: 'CASHIER',
    description: 'Cashier Role',
    users: [],
  });

  const mockAdminRole = () => ({
    id: 1,
    name: 'ADMIN',
    description: 'Admin Role',
    users: [{ id: 1, email: 'admin@example.com' }],
  });

  beforeEach(async () => {
    // Define the repository mock
    roleRepoMock = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleService,
        {
          provide: getRepositoryToken(Role),
          useValue: roleRepoMock,
        },
      ],
    }).compile();

    service = module.get<RoleService>(RoleService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    const createDto = {
      name: 'cashier',
      description: 'Cashier Role',
    };

    it('should create a role successfully, forcing uppercase on the name', async () => {
      roleRepoMock.findOne.mockResolvedValue(null);
      roleRepoMock.create.mockReturnValue(mockRole());
      roleRepoMock.save.mockResolvedValue(mockRole());

      const result = await service.create(createDto);

      expect(roleRepoMock.findOne).toHaveBeenCalledWith({ where: { name: 'CASHIER' } });
      expect(roleRepoMock.create).toHaveBeenCalledWith({
        name: 'CASHIER',
        description: createDto.description,
      });
      expect(roleRepoMock.save).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Role created successfully',
        data: mockRole(),
      });
    });

    it('should throw ConflictException if the role already exists', async () => {
      roleRepoMock.findOne.mockResolvedValue(mockRole());

      await expect(service.create(createDto)).rejects.toThrow(
        new ConflictException('Role already exists'),
      );

      expect(roleRepoMock.findOne).toHaveBeenCalled();
      expect(roleRepoMock.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll()', () => {
    it('should return all roles with associated users sorted by ID descending', async () => {
      roleRepoMock.find.mockResolvedValue([mockRole(), mockAdminRole()]);

      const result = await service.findAll();

      expect(roleRepoMock.find).toHaveBeenCalledWith({
        order: { id: 'DESC' },
        relations: ['users'],
      });
      expect(result).toEqual([mockRole(), mockAdminRole()]);
    });
  });

  describe('findOne()', () => {
    it('should return a role by ID if found', async () => {
      roleRepoMock.findOne.mockResolvedValue(mockRole());

      const result = await service.findOne(2);

      expect(roleRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: 2 },
        relations: ['users'],
      });
      expect(result).toEqual(mockRole());
    });

    it('should throw NotFoundException if the role is not found', async () => {
      roleRepoMock.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        new NotFoundException('Role not found'),
      );
    });
  });

  describe('update()', () => {
    const updateDto = {
      name: 'cashier-updated',
      description: 'Updated Description',
    };

    it('should update role details successfully, forcing name uppercase', async () => {
      const existingRole = mockRole();
      roleRepoMock.findOne.mockResolvedValue(existingRole);
      roleRepoMock.save.mockResolvedValue({
        ...existingRole,
        name: 'CASHIER-UPDATED',
        description: 'Updated Description',
      });

      const result = await service.update(2, updateDto);

      expect(roleRepoMock.findOne).toHaveBeenCalled();
      expect(roleRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'CASHIER-UPDATED',
          description: 'Updated Description',
        }),
      );
      expect(result.message).toBe('Role updated successfully');
    });

    it('should throw BadRequestException if the role to update is not found', async () => {
      roleRepoMock.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(
        new BadRequestException('Failed to update role'),
      );
    });
  });

  describe('remove()', () => {
    it('should remove a role successfully if it has no assigned users', async () => {
      roleRepoMock.findOne.mockResolvedValue(mockRole()); // mockRole() has users: []
      roleRepoMock.remove.mockResolvedValue(mockRole());

      const result = await service.remove(2);

      expect(roleRepoMock.findOne).toHaveBeenCalled();
      expect(roleRepoMock.remove).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Role deleted successfully' });
    });

    it('should throw BadRequestException if trying to delete a role assigned to users', async () => {
      roleRepoMock.findOne.mockResolvedValue(mockAdminRole()); // has users: [{ id: 1 }]

      await expect(service.remove(1)).rejects.toThrow(
        new BadRequestException('Cannot delete role assigned to users'),
      );

      expect(roleRepoMock.findOne).toHaveBeenCalled();
      expect(roleRepoMock.remove).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if the role to remove is not found', async () => {
      roleRepoMock.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(
        new NotFoundException('Role not found'),
      );
    });
  });
});
