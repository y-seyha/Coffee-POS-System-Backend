import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    OneToOne,
    Index,
} from 'typeorm';
import {BaseEntity} from "./base.entity";
import {OrderItem} from "./order_items.entity";
import {OrderAddress} from "./order_addresses.entity";
import {OrderStatusHistory} from "./order_status_history.entity";


export enum OrderType {
    DINEIN = 'DINEIN',
    TAKEAWAY = 'TAKEAWAY',
    DELIVERY = 'DELIVERY',
}

export enum OrderStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    PREPARING = 'PREPARING',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

@Entity('orders')
export class Order extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Index({ unique: true })
    @Column()
    order_number: string;

    @Column({ type: 'enum', enum: OrderType })
    order_type: OrderType;

    @Column({ nullable: true })
    customer_id: number;

    @Column({ nullable: true })
    table_id: number;

    @Column({ nullable: true })
    staff_id: number;

    @Column({
        type: 'enum',
        enum: OrderStatus,
        default: OrderStatus.PENDING,
    })
    order_status: OrderStatus;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    subtotal: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
    discount_amount: number;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    tax_amount: number;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    grand_total: number;

    @Column({ type: 'timestamp', nullable: true })
    cancelled_at: Date;

    @OneToMany(() => OrderItem, (item) => item.order, {
        cascade: true,
    })
    items: OrderItem[];

    @OneToOne(() => OrderAddress, (address) => address.order)
    address: OrderAddress;

    @OneToMany(() => OrderStatusHistory, (h) => h.order)
    status_history: OrderStatusHistory[];
}