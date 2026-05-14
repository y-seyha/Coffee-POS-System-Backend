import {
    Entity,
    Column,
    ManyToOne,
    OneToMany,
    JoinColumn,
    PrimaryGeneratedColumn,
    Index,
} from 'typeorm';

import { Category } from './category.entity';
import { ProductVariant } from './product_variant.entity';
import {BaseEntity} from "./base.entity";

@Entity('products')
export class Product extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Category, (category) => category.products, {
        nullable: false,
        onDelete: 'RESTRICT',
    })
    @JoinColumn({ name: 'category_id' })
    category: Category;

    @Index()
    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Index('IDX_PRODUCT_SKU', { unique: true })
    @Column()
    sku: string;

    @Column('decimal', { precision: 10, scale: 2 })
    price: number;

    @Column('decimal', { precision: 10, scale: 2, nullable: true })
    cost_price: number;

    @Column({ nullable: true })
    image_url: string;

    @Column({ default: true })
    is_available: boolean;

    @OneToMany(() => ProductVariant, (variant) => variant.product, {
        cascade: true,
    })
    variants: ProductVariant[];
}