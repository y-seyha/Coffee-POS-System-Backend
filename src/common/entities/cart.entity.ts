import {Entity, PrimaryGeneratedColumn, Column, OneToMany, Index} from 'typeorm';
import {BaseEntity} from "./base.entity";
import {CartItem} from "./cart_items.entity";

@Entity('carts')
export class Cart extends BaseEntity
{
    @PrimaryGeneratedColumn()
    id: number;

    @Index({ unique: true })
    @Column()
    session_id: string;

    @Column({ nullable: true })
    customer_id: number;

    @Column({ nullable: true })
    staff_id: number;

    @OneToMany(() => CartItem, (item) => item.cart, {
        cascade: true,
    })
    items: CartItem[];
}