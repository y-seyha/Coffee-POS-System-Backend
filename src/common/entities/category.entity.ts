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

@Entity('categories')
export class Category extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Index()
    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ nullable: true })
    image: string;

    // Self relation (parent)
    @ManyToOne(() => Category, (category) => category.children, {
        nullable: true,
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'parent_id' })
    parent: Category;

    @OneToMany(() => Category, (category) => category.parent)
    children: Category[];

    @OneToMany(() => Product, (product) => product.category)
    products: Product[];
}