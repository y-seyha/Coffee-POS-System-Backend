import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import {BaseEntity} from "./base.entity";
import {Cart} from "./cart.entity";

@Entity('cart_items')
export class CartItem extends BaseEntity {
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

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    total_price: number;

    @ManyToOne(() => Cart, (cart) => cart.items, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'cart_id' })
    cart: Cart;
}