import {
    Entity,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
    PrimaryGeneratedColumn,
    Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Product } from './product.entity';
import { VariantOption } from './variant_options.entity';

export enum VariantType {
    SIZE = 'SIZE',
    SUGAR = 'SUGAR',
    ICE = 'ICE',
}

@Entity('product_variants')
export class ProductVariant extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Product, (product) => product.variants, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Index()
    @Column({ type: 'enum', enum: VariantType })
    type: VariantType;

    @OneToMany(() => VariantOption, (option) => option.variant, {
        cascade: true,
    })
    options: VariantOption[];
}