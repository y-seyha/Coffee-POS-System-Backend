import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';

import { BaseEntity } from './base.entity';
import { Product } from './product.entity';
import {VariantGroup} from "./variant_groups.entity";

@Entity('product_variant_groups')
export class ProductVariantGroup extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    product_id: number;

    @Column()
    variant_group_id: number;

    @Column({ default: true })
    is_required: boolean;

    @Column({ default: 0 })
    sort_order: number;

    @ManyToOne(() => Product, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @ManyToOne(() => VariantGroup, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'variant_group_id' })
    variant_group: VariantGroup;
}