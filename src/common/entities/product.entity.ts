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
import {BaseEntity} from "./base.entity";
import {File} from "./file_upload.entity";
import {ProductVariantGroup} from "./product_variant_groups.entity";

@Entity('products')
export class Product extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'category_id' })
    category_id: number;

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

    @Column({ default: true })
    is_available: boolean;

    @Column({ default: true })
    is_active: boolean;

    @Column({ default: 0 })
    sort_order: number;

    @OneToMany(
        () => ProductVariantGroup,
        (productVariantGroup) => productVariantGroup.product,
    )
    variant_groups: ProductVariantGroup[];

    @OneToMany(() => File, (file) => file.product)
    images: File[];
}