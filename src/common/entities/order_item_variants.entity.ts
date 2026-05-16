import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import {BaseEntity} from "./base.entity";
import {OrderItem} from "./order_items.entity";


@Entity('order_item_variants')
export class OrderItemVariant extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    variant_option_id: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    price_adjustment: number;

    @Column()
    variant_group_id: number;

    @Column()
    variant_group_name: string;

    @Column()
    variant_option_name: string;

    @ManyToOne(() => OrderItem, (item) => item.variants, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'order_item_id' })
    orderItem: OrderItem;


}