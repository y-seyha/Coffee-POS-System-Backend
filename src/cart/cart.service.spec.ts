import { Test, TestingModule } from '@nestjs/testing';
import { CartService } from './cart.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Cart } from '../common/entities/cart.entity';
import { CartItem } from '../common/entities/cart_items.entity';
import { Product } from '../common/entities/product.entity';
import { VariantOption } from '../common/entities/variant_options.entity';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('CartService', () => {
  let service: CartService;
  
  // Mocks declaration
  let cartRepoMock: any;
  let cartItemRepoMock: any;
  let productRepoMock: any;
  let variantOptionRepoMock: any;

  // Mock Data Generators
  const mockCart = () => ({
    id: 1,
    staff: { id: 10 },
    items: [],
  });

  const mockProduct = () => ({
    id: 1,
    name: 'Latte',
    price: '4.50',
    is_active: true,
    discount: null,
  });

  const mockCartItem = () => ({
    id: 1,
    cart: mockCart(),
    product_id: 1,
    quantity: 2,
    unit_price: '4.50',
    product: mockProduct(),
    variants: [],
  });

  beforeEach(async () => {
    // Initialize mocks inside beforeEach
    cartRepoMock = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      manager: {
        transaction: jest.fn(),
      },
    };

    cartItemRepoMock = {
      findOne: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };

    productRepoMock = {
      findOneBy: jest.fn(),
    };

    variantOptionRepoMock = {
      findOne: jest.fn(),
      findBy: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: getRepositoryToken(Cart),
          useValue: cartRepoMock,
        },
        {
          provide: getRepositoryToken(CartItem),
          useValue: cartItemRepoMock,
        },
        {
          provide: getRepositoryToken(Product),
          useValue: productRepoMock,
        },
        {
          provide: getRepositoryToken(VariantOption),
          useValue: variantOptionRepoMock,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // 1. getOrCreateCart()
  describe('getOrCreateCart', () => {
    it('should return existing cart for staffId', async () => {
      const cart = mockCart();
      cartRepoMock.findOne.mockResolvedValue(cart);

      const result = await service.getOrCreateCart(10);

      expect(cartRepoMock.findOne).toHaveBeenCalledWith({
        where: { staff: { id: 10 } },
        relations: ['items', 'items.product', 'staff'],
      });
      expect(result).toEqual(cart);
    });

    it('should create new cart if none exists', async () => {
      cartRepoMock.findOne.mockResolvedValue(null);
      
      const newCart = mockCart();
      cartRepoMock.create.mockReturnValue(newCart);
      cartRepoMock.save.mockResolvedValue(newCart);

      const result = await service.getOrCreateCart(10);

      expect(cartRepoMock.create).toHaveBeenCalledWith({ staff: { id: 10 } });
      expect(cartRepoMock.save).toHaveBeenCalledWith(newCart);
      expect(result).toEqual(newCart);
    });
  });

  // 2. addItem()
  describe('addItem', () => {
    it('should add new item to cart successfully', async () => {
      const cart = mockCart();
      cartRepoMock.findOne.mockResolvedValue(cart); // For getOrCreateCart

      const product = mockProduct();
      productRepoMock.findOneBy.mockResolvedValue(product);

      cartItemRepoMock.find.mockResolvedValue([]); // No existing items

      const savedItem = mockCartItem();
      
      // Mocking the transaction manager
      const mockManager = {
        getRepository: jest.fn().mockImplementation((entity) => {
          if (entity.name === 'CartItem') {
            return {
              create: jest.fn().mockReturnValue(savedItem),
              save: jest.fn().mockResolvedValue(savedItem),
            };
          }
          if (entity.name === 'CartItemVariant') {
            return { save: jest.fn() };
          }
        }),
      };
      
      cartRepoMock.manager.transaction.mockImplementation(async (cb: any) => {
        return await cb(mockManager);
      });

      // Mock for findCartItemWithVariants at the end of transaction
      cartItemRepoMock.findOne.mockResolvedValue(savedItem);

      const result = await service.addItem(10, { product_id: 1, quantity: 1, variants: [] });

      expect(result).toEqual({
        message: 'Item added to cart successfully',
        data: savedItem,
      });
    });

    it('should throw NotFoundException if product not found', async () => {
      const cart = mockCart();
      cartRepoMock.findOne.mockResolvedValue(cart); // For getOrCreateCart

      productRepoMock.findOneBy.mockResolvedValue(null);

      await expect(service.addItem(10, { product_id: 999, quantity: 1 })).rejects.toThrow(
        new NotFoundException('Product not found'),
      );
    });
  });

  // 3. removeItem()
  describe('removeItem', () => {
    it('should remove item from cart successfully', async () => {
      const item = mockCartItem();
      cartItemRepoMock.findOne.mockResolvedValue(item);
      cartItemRepoMock.remove.mockResolvedValue(item);

      const result = await service.removeItem(10, 1);

      expect(cartItemRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: 1, cart: { staff: { id: 10 } } },
        relations: ['cart', 'cart.staff'],
      });
      expect(cartItemRepoMock.remove).toHaveBeenCalledWith(item);
      expect(result).toEqual({ message: 'Item removed successfully' });
    });

    it('should throw NotFoundException if item not found', async () => {
      cartItemRepoMock.findOne.mockResolvedValue(null);

      await expect(service.removeItem(10, 999)).rejects.toThrow(
        new NotFoundException('Item not found'),
      );
    });
  });

  // 4. clearCart()
  describe('clearCart', () => {
    it('should delete all items from cart', async () => {
      const cart = mockCart();
      cartRepoMock.findOne.mockResolvedValue(cart); // For getOrCreateCart
      
      cartItemRepoMock.count.mockResolvedValue(2); // Has items
      cartItemRepoMock.delete.mockResolvedValue({ affected: 2 });

      const result = await service.clearCart(10);

      expect(cartItemRepoMock.delete).toHaveBeenCalledWith({ cart: { id: cart.id } });
      expect(result).toEqual({
        message: 'Cart cleared successfully',
        deleted_items: 2,
      });
    });

    it('should return already empty message if cart has no items', async () => {
      const cart = mockCart();
      cartRepoMock.findOne.mockResolvedValue(cart); // For getOrCreateCart
      
      cartItemRepoMock.count.mockResolvedValue(0); // Empty cart

      const result = await service.clearCart(10);

      expect(cartItemRepoMock.delete).not.toHaveBeenCalled();
      expect(result).toEqual({ message: 'Cart is already empty' });
    });
  });

  // 5. updateQuantity()
  describe('updateQuantity', () => {
    it('should update item quantity successfully', async () => {
      const item = mockCartItem();
      cartItemRepoMock.findOne.mockResolvedValue(item);
      cartItemRepoMock.save.mockResolvedValue({ ...item, quantity: 3 });

      const result = await service.updateQuantity(10, 1, { quantity: 3 });

      expect(cartItemRepoMock.findOne).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: 1, cart: { staff: { id: 10 } } }
      }));
      expect(cartItemRepoMock.save).toHaveBeenCalled();
      expect(result.message).toEqual('Quantity updated successfully');
      expect(result.data.quantity).toEqual(3);
    });

    it('should throw NotFoundException if item not found', async () => {
      cartItemRepoMock.findOne.mockResolvedValue(null);

      await expect(service.updateQuantity(10, 999, { quantity: 3 })).rejects.toThrow(
        new NotFoundException('Item not found'),
      );
    });

    it('should throw BadRequestException if quantity is negative', async () => {
      const item = mockCartItem();
      cartItemRepoMock.findOne.mockResolvedValue(item);

      await expect(service.updateQuantity(10, 1, { quantity: -1 })).rejects.toThrow(
        new BadRequestException('Quantity cannot be negative'),
      );
    });

    it('should remove item if quantity is 0', async () => {
      const item = mockCartItem();
      cartItemRepoMock.findOne.mockResolvedValue(item);
      cartItemRepoMock.remove.mockResolvedValue(item);

      const result = await service.updateQuantity(10, 1, { quantity: 0 });

      expect(cartItemRepoMock.remove).toHaveBeenCalledWith(item);
      expect(result).toEqual({ message: 'Item removed from cart' });
    });
  });
});
