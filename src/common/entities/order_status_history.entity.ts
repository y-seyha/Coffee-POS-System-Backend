import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import {BaseEntity} from "./base.entity";
import {Order, OrderStatus} from "./orders.entity";
import {User} from "./user.entity";


@Entity('order_status_history')
export class OrderStatusHistory extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column()
    status: OrderStatus;

    @Column({ type: 'text', nullable: true })
    notes: string;

    @ManyToOne(() => Order, (order) => order.status_history, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @ManyToOne(() => User, {
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'changed_by' })
    user: User;
}