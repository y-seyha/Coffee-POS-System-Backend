import { Test, TestingModule } from '@nestjs/testing';
import { ProductService } from './product.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Product } from '../common/entities/product.entity';
import { ProductVariantGroup } from '../common/entities/product_variant_groups.entity';
import { Discount } from '../common/entities/discount.entity';
import { File } from '../common/entities/file_upload.entity';
import { FileUploadService } from '../file-upload/file-upload.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('ProductService', () => {
  let service: ProductService;
  let productRepoMock: any;
  let productVariantGroupRepoMock: any;
  let discountRepoMock: any;
  let fileUploadServiceMock: any;
  let mockQueryRunner: any;
  let mockFileRepo: any;

  const mockProduct = () => ({
    id: 1,
    category_id: 2,
    name: 'Espresso',
    sku: 'ESP-001',
    price: '3.50',
    description: 'Fresh espresso shot',
    discount_id: null,
    discount: null,
  });

  const mockDiscount = () => ({
    id: 5,
    name: 'Summer Sale',
    type: 'PERCENTAGE',
    value: '10.00',
    is_active: true,
  });

  beforeEach(async () => {
    // Define repo mocks
    productRepoMock = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    productVariantGroupRepoMock = {
      delete: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    discountRepoMock = {
      findOne: jest.fn(),
    };

    fileUploadServiceMock = {
      uploadToCloud: jest.fn(),
    };

    mockFileRepo = {
      create: jest.fn(),
      save: jest.fn(),
    };

    // Configure the custom QueryRunner mock
    mockQueryRunner = {
      connect: jest.fn().mockResolvedValue(undefined),
      startTransaction: jest.fn().mockResolvedValue(undefined),
      commitTransaction: jest.fn().mockResolvedValue(undefined),
      rollbackTransaction: jest.fn().mockResolvedValue(undefined),
      release: jest.fn().mockResolvedValue(undefined),
      manager: {
        create: jest.fn(),
        save: jest.fn(),
        getRepository: jest.fn().mockImplementation((entity) => {
          if (entity === File) return mockFileRepo;
        }),
      },
    };

    // Attach custom query runner connection mapping onto productRepoMock
    productRepoMock.manager = {
      connection: {
        createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getRepositoryToken(Product),
          useValue: productRepoMock,
        },
        {
          provide: getRepositoryToken(ProductVariantGroup),
          useValue: productVariantGroupRepoMock,
        },
        {
          provide: getRepositoryToken(Discount),
          useValue: discountRepoMock,
        },
        {
          provide: FileUploadService,
          useValue: fileUploadServiceMock,
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne()', () => {
    it('should return a product when found by ID', async () => {
      productRepoMock.findOne.mockResolvedValue(mockProduct());

      const result = await service.findOne(1);

      expect(productRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['category', 'images', 'variant_groups', 'discount'],
      });
      expect(result).toEqual(mockProduct());
    });

    it('should throw NotFoundException if product is not found', async () => {
      productRepoMock.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        new NotFoundException('Product not found'),
      );
    });
  });

  describe('create()', () => {
    const createDto = {
      category_id: 2,
      name: 'Espresso',
      sku: 'ESP-001',
      price: 3.50,
      description: 'Fresh espresso shot',
    };

    const mockFiles = [
      { originalname: 'esp.png', mimetype: 'image/png', size: 500 } as Express.Multer.File,
    ];

    it('should create product, upload files, and commit transaction successfully', async () => {
      mockQueryRunner.manager.create.mockReturnValue(mockProduct());
      mockQueryRunner.manager.save.mockResolvedValue(mockProduct());
      fileUploadServiceMock.uploadToCloud.mockResolvedValue({
        secure_url: 'http://cloud.com/esp.png',
        public_id: 'esp123',
      });
      mockFileRepo.create.mockReturnValue({});
      mockFileRepo.save.mockResolvedValue({});

      // Mock this.findOne inside create()
      productRepoMock.findOne.mockResolvedValue(mockProduct());

      const result = await service.create(createDto, mockFiles, 1);

      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.create).toHaveBeenCalledWith(Product, expect.any(Object));
      expect(mockQueryRunner.manager.save).toHaveBeenCalled();
      expect(fileUploadServiceMock.uploadToCloud).toHaveBeenCalledWith(mockFiles[0]);
      expect(mockFileRepo.create).toHaveBeenCalled();
      expect(mockFileRepo.save).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.rollbackTransaction).not.toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(result).toEqual(mockProduct());
    });

    it('should rollback transaction and rethrow error on file upload failure', async () => {
      mockQueryRunner.manager.create.mockReturnValue(mockProduct());
      mockQueryRunner.manager.save.mockResolvedValue(mockProduct());
      fileUploadServiceMock.uploadToCloud.mockRejectedValue(new Error('Cloudinary error'));

      await expect(service.create(createDto, mockFiles, 1)).rejects.toThrow('Cloudinary error');

      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('update()', () => {
    const updateDto = {
      name: 'Espresso Updated',
      price: 3.99,
    };

    it('should update product successfully', async () => {
      productRepoMock.findOne.mockResolvedValue(mockProduct());
      productRepoMock.update.mockResolvedValue({});

      // Mock the second findOne call returning updated details
      productRepoMock.findOne.mockResolvedValue({
        ...mockProduct(),
        name: 'Espresso Updated',
        price: '3.99',
      });

      const result = await service.update(1, updateDto);

      expect(productRepoMock.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(productRepoMock.update).toHaveBeenCalledWith(1, expect.any(Object));
      expect(result.name).toBe('Espresso Updated');
    });

    it('should throw NotFoundException if the product is not found', async () => {
      productRepoMock.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateDto)).rejects.toThrow(
        new NotFoundException('Product not found'),
      );
    });
  });

  describe('remove()', () => {
    it('should delete product successfully', async () => {
      productRepoMock.findOne.mockResolvedValue(mockProduct());
      productRepoMock.delete.mockResolvedValue({});

      const result = await service.remove(1);

      expect(productRepoMock.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(productRepoMock.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual({ message: 'Product deleted successfully' });
    });

    it('should throw NotFoundException if product is not found', async () => {
      productRepoMock.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(
        new NotFoundException('Product not found'),
      );
    });
  });

  describe('findByCategory()', () => {
    it('should return products associated with categoryId', async () => {
      productRepoMock.find.mockResolvedValue([mockProduct()]);

      const result = await service.findByCategory(2);

      expect(productRepoMock.find).toHaveBeenCalledWith({
        where: { category_id: 2 },
        relations: ['images', 'variant_groups'],
        order: { sort_order: 'ASC' },
      });
      expect(result).toEqual([mockProduct()]);
    });
  });

  describe('attachVariantGroups()', () => {
    const attachDto = {
      variant_groups: [
        { variant_group_id: 3, is_required: true, sort_order: 1 },
      ],
    };

    it('should detach old variant groups and attach new ones successfully', async () => {
      productRepoMock.findOne.mockResolvedValue(mockProduct());
      productVariantGroupRepoMock.delete.mockResolvedValue({});
      productVariantGroupRepoMock.create.mockReturnValue({});
      productVariantGroupRepoMock.save.mockResolvedValue({});

      const result = await service.attachVariantGroups(1, attachDto);

      expect(productRepoMock.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(productVariantGroupRepoMock.delete).toHaveBeenCalledWith({ product_id: 1 });
      expect(productVariantGroupRepoMock.create).toHaveBeenCalled();
      expect(productVariantGroupRepoMock.save).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Variant groups attached successfully',
        count: 1,
      });
    });

    it('should throw NotFoundException if the product is not found', async () => {
      productRepoMock.findOne.mockResolvedValue(null);

      await expect(service.attachVariantGroups(999, attachDto)).rejects.toThrow(
        new NotFoundException('Product not found'),
      );
    });
  });

  describe('assignDiscount()', () => {
    it('should assign discount to product successfully', async () => {
      productRepoMock.findOne.mockResolvedValue(mockProduct());
      discountRepoMock.findOne.mockResolvedValue(mockDiscount());
      productRepoMock.save.mockResolvedValue({
        ...mockProduct(),
        discount: mockDiscount(),
      });

      const result = await service.assignDiscount(1, 5);

      expect(productRepoMock.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(discountRepoMock.findOne).toHaveBeenCalledWith({ where: { id: 5 } });
      expect(productRepoMock.save).toHaveBeenCalled();
      expect(result.discount).toEqual(mockDiscount());
    });

    it('should throw NotFoundException if product is not found', async () => {
      productRepoMock.findOne.mockResolvedValue(null);

      await expect(service.assignDiscount(999, 5)).rejects.toThrow(
        new NotFoundException('Product not found'),
      );
    });

    it('should throw NotFoundException if discount is not found', async () => {
      productRepoMock.findOne.mockResolvedValue(mockProduct());
      discountRepoMock.findOne.mockResolvedValue(null);

      await expect(service.assignDiscount(1, 999)).rejects.toThrow(
        new NotFoundException('Discount not found'),
      );
    });
  });

  describe('removeDiscount()', () => {
    it('should remove discount from product successfully by setting it to null', async () => {
      const productWithDiscount = {
        ...mockProduct(),
        discount_id: 5,
        discount: mockDiscount(),
      };
      productRepoMock.findOne.mockResolvedValue(productWithDiscount);
      productRepoMock.save.mockResolvedValue({
        ...mockProduct(),
        discount_id: null,
      });

      await service.removeDiscount(1);

      expect(productRepoMock.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(productRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ discount_id: null }),
      );
    });

    it('should throw NotFoundException if product is not found', async () => {
      productRepoMock.findOne.mockResolvedValue(null);

      await expect(service.removeDiscount(999)).rejects.toThrow(
        new NotFoundException('Product not found'),
      );
    });
  });
});
