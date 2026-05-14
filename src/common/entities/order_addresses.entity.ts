import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
} from 'typeorm';
import {BaseEntity} from "./base.entity";
import {Order} from "./orders.entity";


@Entity('order_addresses')
export class OrderAddress extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    receiver_name: string;

    @Column()
    phone: string;

    @Column()
    address_line1: string;

    @Column({ nullable: true })
    address_line2: string;

    @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
    lat: number;

    @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
    lng: number;

    @OneToOne(() => Order, (order) => order.address, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'order_id' })
    order: Order;
}