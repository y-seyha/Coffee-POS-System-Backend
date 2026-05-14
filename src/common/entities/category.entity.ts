import {
    Entity,
    Column,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Product } from './product.entity';

@Entity('categories')
export class Category extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;


    @OneToMany(() => Product, (product) => product.category)
    products: Product[];
}