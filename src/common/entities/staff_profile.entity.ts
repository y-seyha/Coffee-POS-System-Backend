import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn,
} from 'typeorm';


import { BaseEntity } from './base.entity';
import {User} from "./user.entity";

@Entity('staff_profiles')
export class StaffProfile extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    employee_code: string;

    @Column()
    position: string;

    @Column({ type: 'date' })
    hire_date: Date;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    salary: string; // TypeORM decimal = string

    @Column({ type: 'text' })
    address: string;

    @OneToOne(() => User, (user) => user.staffProfile, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'user_id' })
    user: User;
}