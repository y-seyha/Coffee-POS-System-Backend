import {Entity, PrimaryGeneratedColumn, Column, OneToMany, Index, ManyToOne, JoinColumn} from 'typeorm';
import {BaseEntity} from "./base.entity";
import {CartItem} from "./cart_items.entity";
import {User} from "./user.entity";

@Entity('carts')
export class Cart extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    staff_id: number;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'staff_id' })
    staff: User;

    @OneToMany(() => CartItem, (item) => item.cart)
    items: CartItem[];
}