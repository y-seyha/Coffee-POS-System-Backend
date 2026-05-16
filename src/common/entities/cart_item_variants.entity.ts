import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import {BaseEntity} from "./base.entity";
import {CartItem} from "./cart_items.entity";
import {VariantGroup} from "./variant_groups.entity";
import {VariantOption} from "./variant_options.entity";

@Entity('cart_item_variants')
export class CartItemVariant extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    cart_item_id: number;

    @ManyToOne(() => CartItem, (item) => item.variants, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'cart_item_id' })
    cart_item: CartItem;

    @Column()
    variant_group_id: number;

    @Column()
    variant_option_id: number;

    @ManyToOne(() => VariantGroup, { eager: false })
    @JoinColumn({ name: 'variant_group_id' })
    variant_group: VariantGroup;

    @ManyToOne(() => VariantOption, { eager: false })
    @JoinColumn({ name: 'variant_option_id' })
    variant_option: VariantOption;
}