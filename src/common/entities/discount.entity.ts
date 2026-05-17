import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
} from 'typeorm';

import { BaseEntity } from './base.entity';

export enum DiscountType {
    PERCENTAGE = 'PERCENTAGE',
    FIXED = 'FIXED',
}

@Entity('discounts')
export class Discount extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({
        type: 'enum',
        enum: DiscountType,
    })
    type: DiscountType;

    @Column('decimal', {
        precision: 10,
        scale: 2,
    })
    value: number;

    @Column({ default: true })
    is_active: boolean;

    @Column({ nullable: true })
    start_date: Date;

    @Column({ nullable: true })
    end_date: Date;
}