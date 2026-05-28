import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payment.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Payment, PaymentStatus } from '../common/entities/payment.entity';
import { PaymentStatusHistory } from '../common/entities/payment_status_history.entity';
import { Order, OrderStatus } from '../common/entities/orders.entity';
import { OrderStatusHistory } from '../common/entities/order_status_history.entity';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let paymentRepoMock: any;
  let historyRepoMock: any;
  let orderRepoMock: any;
  let orderHistoryRepoMock: any;

  const mockPayment = () => ({
    id: 1,
    payment_status: PaymentStatus.PENDING,
    payment_method: 'CASH',
    amount: '25.00',
    order: {
      id: 1,
      order_status: OrderStatus.CONFIRMED,
      items: [],
      payments: [],
    },
  });

  const mockPaidPayment = () => ({
    ...mockPayment(),
    payment_status: PaymentStatus.PAID,
    paid_at: new Date(),
  });

  beforeEach(async () => {
    // Define repositories mocks
    paymentRepoMock = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      create: jest.fn(),
    };

    historyRepoMock = {
      create: jest.fn(),
      save: jest.fn(),
    };

    orderRepoMock = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    orderHistoryRepoMock = {
      create: jest.fn(),
      save: jest.fn(),
    };

    // Safe Mock implementation for Entity create methods to avoid Option A vs Option B mismatches
    paymentRepoMock.create.mockImplementation((dto: any) => dto);
    historyRepoMock.create.mockImplementation((dto: any) => dto);
    orderHistoryRepoMock.create.mockImplementation((dto: any) => dto);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getRepositoryToken(Payment),
          useValue: paymentRepoMock,
        },
        {
          provide: getRepositoryToken(PaymentStatusHistory),
          useValue: historyRepoMock,
        },
        {
          provide: getRepositoryToken(Order),
          useValue: orderRepoMock,
        },
        {
          provide: getRepositoryToken(OrderStatusHistory),
          useValue: orderHistoryRepoMock,
        },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getPaymentById()', () => {
    it('should return a payment with relations when found successfully', async () => {
      paymentRepoMock.findOne.mockResolvedValue(mockPayment());

      const result = await service.getPaymentById(1);

      expect(paymentRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['order', 'order.items'],
      });
      expect(result).toEqual(mockPayment());
    });

    it('should throw InternalServerErrorException on database query failure', async () => {
      paymentRepoMock.findOne.mockRejectedValue(new Error('Query failed'));

      await expect(service.getPaymentById(1)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('markAsPaid()', () => {
    it('should mark a PENDING payment as PAID and log progress inside history', async () => {
      const pendingPayment = { ...mockPayment() };
      paymentRepoMock.findOne.mockResolvedValue(pendingPayment);
      paymentRepoMock.save.mockResolvedValue({
        ...pendingPayment,
        payment_status: PaymentStatus.PAID,
        paid_at: new Date(),
      });
      historyRepoMock.save.mockResolvedValue({});

      const result = await service.markAsPaid(1, 10, 'TRX123');

      expect(paymentRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['order', 'order.items', 'order.payments'],
      });
      expect(paymentRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_status: PaymentStatus.PAID,
          transaction_id: 'TRX123',
        }),
      );
      expect(historyRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          old_status: PaymentStatus.PENDING,
          new_status: PaymentStatus.PAID,
          changed_by: { id: 10 },
        }),
      );
      expect(result).toEqual({ message: 'Payment marked as paid' });
    });

    it('should throw BadRequestException if payment is already PAID', async () => {
      const paidPayment = { ...mockPaidPayment() };
      paymentRepoMock.findOne.mockResolvedValue(paidPayment);

      await expect(service.markAsPaid(1, 10)).rejects.toThrow(
        BadRequestException,
      );

      expect(paymentRepoMock.save).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException if payment is not found (due to try-catch wrapping in service)', async () => {
      paymentRepoMock.findOne.mockResolvedValue(null);

      await expect(service.markAsPaid(999, 10)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('markAsFailed()', () => {
    it('should mark a payment as FAILED and save update in payment history', async () => {
      const pendingPayment = { ...mockPayment() };
      paymentRepoMock.findOne.mockResolvedValue(pendingPayment);
      paymentRepoMock.save.mockResolvedValue({
        ...pendingPayment,
        payment_status: PaymentStatus.FAILED,
      });
      historyRepoMock.save.mockResolvedValue({});

      const result = await service.markAsFailed(1, 10, 'Card declined');

      expect(paymentRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['order', 'order.items', 'order.payments'],
      });
      expect(paymentRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ payment_status: PaymentStatus.FAILED }),
      );
      expect(historyRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          old_status: PaymentStatus.PENDING,
          new_status: PaymentStatus.FAILED,
          notes: 'Card declined',
          changed_by: { id: 10 },
        }),
      );
      expect(result).toEqual({ message: 'Payment marked as failed' });
    });

    it('should throw InternalServerErrorException if payment is not found (due to try-catch wrapping in service)', async () => {
      paymentRepoMock.findOne.mockResolvedValue(null);

      await expect(service.markAsFailed(999, 10)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('refundPayment()', () => {
    const refundReason = 'Customer returned order';

    it('should refund a PAID payment, cancel the associated order, and log both histories', async () => {
      const paidPayment = { ...mockPaidPayment() };
      paymentRepoMock.findOne.mockResolvedValue(paidPayment);
      paymentRepoMock.save.mockResolvedValue({
        ...paidPayment,
        payment_status: PaymentStatus.REFUNDED,
      });
      historyRepoMock.save.mockResolvedValue({});
      orderRepoMock.save.mockResolvedValue({});
      orderHistoryRepoMock.save.mockResolvedValue({});

      const result = await service.refundPayment(1, 10, refundReason);

      expect(paymentRepoMock.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['order', 'order.items', 'order.payments'],
      });
      expect(paymentRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({ payment_status: PaymentStatus.REFUNDED }),
      );
      expect(historyRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          old_status: PaymentStatus.PAID,
          new_status: PaymentStatus.REFUNDED,
          notes: refundReason,
          changed_by: { id: 10 },
        }),
      );
      expect(orderRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          order_status: OrderStatus.CANCELLED,
          cancelled_at: expect.any(Date),
        }),
      );
      expect(orderHistoryRepoMock.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: OrderStatus.CANCELLED,
          notes: refundReason,
          user: { id: 10 },
        }),
      );
      expect(result).toEqual({ message: 'Payment refunded successfully' });
    });

    it('should throw BadRequestException if payment status is already REFUNDED', async () => {
      const refundedPayment = {
        ...mockPayment(),
        payment_status: PaymentStatus.REFUNDED,
      };
      paymentRepoMock.findOne.mockResolvedValue(refundedPayment);

      await expect(service.refundPayment(1, 10, refundReason)).rejects.toThrow(
        BadRequestException,
      );

      expect(paymentRepoMock.save).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if payment status is not PAID', async () => {
      const pendingPayment = { ...mockPayment() };
      paymentRepoMock.findOne.mockResolvedValue(pendingPayment);

      await expect(service.refundPayment(1, 10, refundReason)).rejects.toThrow(
        BadRequestException,
      );

      expect(paymentRepoMock.save).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException if payment is not found (due to try-catch wrapping in service)', async () => {
      paymentRepoMock.findOne.mockResolvedValue(null);

      await expect(service.refundPayment(999, 10)).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException if repository save fails during refund', async () => {
      const paidPayment = { ...mockPaidPayment() };
      paymentRepoMock.findOne.mockResolvedValue(paidPayment);
      paymentRepoMock.save.mockRejectedValue(new Error('Database write error'));

      await expect(service.refundPayment(1, 10, refundReason)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
