import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToOne,
    JoinColumn,
} from 'typeorm';


import { BaseEntity } from './base.entity';
import {Role} from "./roles.entity";
import {StaffProfile} from "./staff_profile.entity";

@Entity('users')
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    email: string;

    @Column()
    name: string;

    @Column({ select: false })
    password: string;

    @Column({ nullable: true })
    phone?: string;

    @Column({ default: true })
    is_active: boolean;

    @Column({ type: 'timestamp', nullable: true })
    last_login_at?: Date;

    @Column({ type: 'text', nullable: true })
    email_verification_token: string | null;

    @Column({ type: 'timestamp', nullable: true })
    email_verification_expires: Date | null;

    @Column({ type: 'text', nullable: true })
    refresh_token_hash: string | null;

    @ManyToOne(() => Role, (role) => role.users, {
        nullable: false,
        onDelete: 'RESTRICT',
    })
    @JoinColumn({ name: 'role_id' })
    role: Role;

    @OneToOne(() => StaffProfile, (profile) => profile.user, {
        cascade: true,
        onDelete: 'CASCADE',
    })
    staffProfile: StaffProfile;
}