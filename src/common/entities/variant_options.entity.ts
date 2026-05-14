import {
    Entity,
    Column,
    ManyToOne,
    JoinColumn,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { ProductVariant } from './product_variant.entity';

@Entity('variant_options')
export class VariantOption extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => ProductVariant, (variant) => variant.options, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'variant_id' })
    variant: ProductVariant;

    @Column()
    name: string;

    @Column('decimal', { precision: 10, scale: 2, default: 0 })
    price_adjustment: number;

    @Column({ default: false })
    is_default: boolean;
}