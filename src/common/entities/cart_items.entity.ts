import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Index, OneToMany,
} from 'typeorm';
import {BaseEntity} from "./base.entity";
import {Cart} from "./cart.entity";
import {Product} from "./product.entity";
import {CartItemVariant} from "./cart_item_variants.entity";

@Entity('cart_items')
export class CartItem extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    cart_id: number;

    @ManyToOne(() => Cart, (cart) => cart.items, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'cart_id' })
    cart: Cart;

    @Column()
    product_id: number;

    @ManyToOne(() => Product)
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Column()
    name: string;

    @Column('decimal', { precision: 10, scale: 2 })
    unit_price: string;

    @Column()
    quantity: number;

    @Column('decimal', { precision: 10, scale: 2 })
    total_price: string;

    @OneToMany(() => CartItemVariant, (v) => v.cart_item)
    variants: CartItemVariant[];
}