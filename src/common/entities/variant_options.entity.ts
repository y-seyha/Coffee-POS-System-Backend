import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';

import { BaseEntity } from './base.entity';
import {VariantGroup} from "./variant_groups.entity";


export enum PriceAdjustmentType {
    ADD = 'ADD',
    SET = 'SET',
    PERCENT = 'PERCENT',
}

@Entity('variant_options')
export class VariantOption extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    variant_group_id: number;

    @ManyToOne(() => VariantGroup, (variantGroup) => variantGroup.options, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'variant_group_id' })
    variant_group: VariantGroup;

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: PriceAdjustmentType,
        default: PriceAdjustmentType.ADD,
    })
    price_adjustment_type: PriceAdjustmentType;

    @Column('decimal', {
        precision: 10,
        scale: 2,
        default: 0,
    })
    price_adjustment: number;

    @Column({ default: false })
    is_default: boolean;

    @Column({ default: true })
    is_active: boolean;

    @Column({ default: 0 })
    sort_order: number;
}