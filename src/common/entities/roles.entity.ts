import { Column, Entity, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import {User} from "./user.entity";
import {BaseEntity} from "./base.entity";

@Entity('roles')
export class Role extends  BaseEntity{
    @PrimaryGeneratedColumn()
    id : number;

    @Column({ unique: true })
    name: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @OneToMany(() => User, (user) => user.role)
    users: User[];
}