import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';

import { BaseEntity } from './base.entity';
import { Order } from './orders.entity';

export enum PaymentMethod {
    CASH = 'CASH',
    KHQR = 'KHQR',
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    PAID = 'PAID',
    FAILED = 'FAILED',
    REFUNDED = 'REFUNDED',
}

@Entity('payments')
export class Payment extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Index({ unique: true })
    @Column()
    payment_number: string;

    @ManyToOne(() => Order, (order) => order.payments, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @Column({
        type: 'enum',
        enum: PaymentMethod,
    })
    payment_method: PaymentMethod;

    @Column({
        type: 'enum',
        enum: PaymentStatus,
        default: PaymentStatus.PENDING,
    })
    payment_status: PaymentStatus;

    @Column({
        type: 'decimal',
        precision: 12,
        scale: 2,
    })
    amount: number;

    @Column({ nullable: true })
    transaction_id: string;

    @Column({ type: 'text', nullable: true })
    payment_response: string;

    @Column({ type: 'timestamp', nullable: true })
    paid_at: Date;

    @Column({ type: 'text', nullable: true })
    remarks: string;
}