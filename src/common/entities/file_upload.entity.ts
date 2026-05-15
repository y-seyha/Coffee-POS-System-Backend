import {
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    JoinColumn,
    Index,
} from 'typeorm';

import { User } from './user.entity';
import {BaseEntity} from "./base.entity";
import {Product} from "./product.entity";

@Entity('files')
export class File extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    originalName: string;

    @Column()
    mimeType: string;

    @Column()
    size: number;

    @Column()
    url: string;

    @Index()
    @Column()
    publicId: string;

    @Column({ nullable: true })
    description: string;

    @ManyToOne(() => User, {
        onDelete: 'SET NULL',
    })
    @JoinColumn({ name: 'uploader_id' })
    uploader: User;

    @ManyToOne(() => Product, (product) => product.images, {
        onDelete: 'CASCADE',
        nullable: true,
    })
    @JoinColumn({ name: 'product_id' })
    product?: Product | null;
}