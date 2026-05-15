import {
    Column,
    Entity,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';

import { BaseEntity } from './base.entity';
import {ProductVariantGroup} from "./product_variant_groups.entity";
import {VariantOption} from "./variant_options.entity";

@Entity('variant_groups')
export class VariantGroup extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column({ unique: true })
    code: string;

    @Column({ default: true })
    is_active: boolean;

    @Column({ default: 0 })
    sort_order: number;

    @OneToMany(
        () => ProductVariantGroup,
        (productVariantGroup) => productVariantGroup.variant_group,
    )
    product_variant_groups: ProductVariantGroup[];

    @OneToMany(() => VariantOption, (option) => option.variant_group)
    options: VariantOption[];
}