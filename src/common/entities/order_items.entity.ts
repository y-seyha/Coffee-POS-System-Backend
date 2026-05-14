import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index,
} from 'typeorm';
import {BaseEntity} from "./base.entity";
import {Order} from "./orders.entity";
import {OrderItemVariant} from "./order_item_variants.entity";

@Entity('order_items')
export class OrderItem extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column()
    product_id: number;

    @Column({ nullable: true })
    variant_option_id: number;

    @Column()
    name: string;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    unit_price: number;

    @Column()
    quantity: number;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    discount_amount: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    total_price: number;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @ManyToOne(() => Order, (order) => order.items, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @OneToMany(() => OrderItemVariant, (v) => v.orderItem, {
        cascade: true,
    })
    variants: OrderItemVariant[];
}