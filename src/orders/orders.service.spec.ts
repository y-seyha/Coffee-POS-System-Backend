import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order, OrderStatus } from '../common/entities/orders.entity';
import { OrderStatusHistory } from '../common/entities/order_status_history.entity';
import { Payment } from '../common/entities/payment.entity';
import { NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';

describe('OrdersService', () => {
  let service: OrdersService;
  let orderRepoMock: any;
  let historyRepoMock: any;
  let paymentRepoMock: any;

  const mockOrder = () => ({
    id: 1,
    order_status: OrderStatus.PENDING,
    order_type: 'DINE_IN',
    grand_total: '25.00',
    items: [],
    payments: [{ id: 1, status: 'PENDING' }],
    status_history: [],
  });

  beforeEach(async () => {
    // Define repository mocks
    orderRepoMock = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    historyRepoMock = {
      create: jest.fn(),
      save: jest.fn(),
    };

    paymentRepoMock = {
      find: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getRepositoryToken(Order),
          useValue: orderRepoMock,
        },
        {
          provide: getRepositoryToken(OrderStatusHistory),
          useValue: historyRepoMock,
        },
        {
          provide: getRepositoryToken(Payment),
          useValue: paymentRepoMock,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOrderById()', () => {
    it('should return order with all relations on success', async () => {
      orderRepoMock.findOne.mockResolvedValue(mockOrder());

      const result = await service.getOrderById(1);

      expect(orderRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['items', 'items.variants', 'payments', 'status_history'],
      });
      expect(result).toEqual(mockOrder());
    });

    it('should throw InternalServerErrorException if order is not found', async () => {
      orderRepoMock.findOne.mockResolvedValue(null);

      await expect(service.getOrderById(999)).rejects.toThrow(
        new InternalServerErrorException('Failed to fetch order'),
      );
    });
  });

  describe('confirmOrder()', () => {
    const confirmDto = { note: 'Confirmed note' };

    it('should confirm order successfully and save progress to status history', async () => {
      const pendingOrder = mockOrder();
      orderRepoMock.findOne.mockResolvedValue(pendingOrder);
      orderRepoMock.save.mockResolvedValue({
        ...pendingOrder,
        order_status: OrderStatus.CONFIRMED,
      });
      historyRepoMock.save.mockResolvedValue({});

      const result = await service.confirmOrder(1, 10, confirmDto);

      expect(orderRepoMock.findOne).toHaveBeenCalled();
      expect(orderRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ order_status: OrderStatus.CONFIRMED }),
      );
      expect(historyRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatus.CONFIRMED,
          notes: confirmDto.note,
          user: { id: 10 },
        }),
      );
      expect(result).toEqual({ message: 'Order confirmed' });
    });

    it('should throw BadRequestException if order status is not PENDING', async () => {
      const alreadyConfirmedOrder = {
        ...mockOrder(),
        order_status: OrderStatus.CONFIRMED,
      };
      orderRepoMock.findOne.mockResolvedValue(alreadyConfirmedOrder);

      await expect(service.confirmOrder(1, 10, confirmDto)).rejects.toThrow(
        new BadRequestException('Invalid status transition from CONFIRMED'),
      );

      expect(orderRepoMock.save).not.toHaveBeenCalled();
      expect(historyRepoMock.save).not.toHaveBeenCalled();
    });
  });

  describe('cancelOrder()', () => {
    const cancelDto = { reason: 'Customer changed mind' };

    it('should cancel order, set linked payments to FAILED, and save status history', async () => {
      const pendingOrder = mockOrder();
      orderRepoMock.findOne.mockResolvedValue(pendingOrder);
      orderRepoMock.save.mockResolvedValue({
        ...pendingOrder,
        order_status: OrderStatus.CANCELLED,
      });
      paymentRepoMock.update.mockResolvedValue({});
      historyRepoMock.save.mockResolvedValue({});

      const result = await service.cancelOrder(1, 10, cancelDto);

      expect(orderRepoMock.findOne).toHaveBeenCalled();
      expect(orderRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ order_status: OrderStatus.CANCELLED }),
      );
      expect(paymentRepoMock.update).toHaveBeenCalledWith(
        { order: { id: 1 } },
        expect.objectContaining({
          payment_status: 'FAILED',
          remarks: cancelDto.reason,
        }),
      );
      expect(historyRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatus.CANCELLED,
          notes: cancelDto.reason,
          user: { id: 10 },
        }),
      );
      expect(result).toEqual({ message: 'Order cancelled' });
    });

    it('should throw BadRequestException if order status is already COMPLETED', async () => {
      const completedOrder = {
        ...mockOrder(),
        order_status: OrderStatus.COMPLETED,
      };
      orderRepoMock.findOne.mockResolvedValue(completedOrder);

      await expect(service.cancelOrder(1, 10, cancelDto)).rejects.toThrow(
        new BadRequestException('Completed order cannot be cancelled'),
      );

      expect(orderRepoMock.save).not.toHaveBeenCalled();
      expect(paymentRepoMock.update).not.toHaveBeenCalled();
      expect(historyRepoMock.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if order status is already CANCELLED', async () => {
      const cancelledOrder = {
        ...mockOrder(),
        order_status: OrderStatus.CANCELLED,
      };
      orderRepoMock.findOne.mockResolvedValue(cancelledOrder);

      await expect(service.cancelOrder(1, 10, cancelDto)).rejects.toThrow(
        new BadRequestException('Order already cancelled'),
      );

      expect(orderRepoMock.save).not.toHaveBeenCalled();
    });
  });

  describe('completeOrder()', () => {
    const completeDto = { note: 'Completed note' };

    it('should complete a CONFIRMED order successfully and log status history', async () => {
      const confirmedOrder = {
        ...mockOrder(),
        order_status: OrderStatus.CONFIRMED,
      };
      orderRepoMock.findOne.mockResolvedValue(confirmedOrder);
      orderRepoMock.save.mockResolvedValue({
        ...confirmedOrder,
        order_status: OrderStatus.COMPLETED,
      });
      historyRepoMock.save.mockResolvedValue({});

      const result = await service.completeOrder(1, 10, completeDto);

      expect(orderRepoMock.findOne).toHaveBeenCalled();
      expect(orderRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ order_status: OrderStatus.COMPLETED }),
      );
      expect(historyRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatus.COMPLETED,
          notes: completeDto.note,
          user: { id: 10 },
        }),
      );
      expect(result).toEqual({ message: 'Order completed' });
    });

    it('should throw BadRequestException if order status is not CONFIRMED', async () => {
      const pendingOrder = mockOrder(); // status = PENDING
      orderRepoMock.findOne.mockResolvedValue(pendingOrder);

      await expect(service.completeOrder(1, 10, completeDto)).rejects.toThrow(
        new BadRequestException('Invalid status transition from PENDING'),
      );

      expect(orderRepoMock.save).not.toHaveBeenCalled();
      expect(historyRepoMock.save).not.toHaveBeenCalled();
    });
  });
});
