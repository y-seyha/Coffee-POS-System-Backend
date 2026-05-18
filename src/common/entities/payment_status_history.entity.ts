import {BaseEntity, Column, Entity, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {Payment} from "./payment.entity";
import {User} from "./user.entity";

@Entity('payment_status_history')
export class PaymentStatusHistory extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    old_status: string;

    @Column()
    new_status: string;

    @Column({ nullable: true })
    notes: string;

    @ManyToOne(() => Payment, {
        onDelete: 'CASCADE',
    })
    payment: Payment;

    @ManyToOne(() => User, {
        onDelete: 'SET NULL',
    })
    changed_by: User;
}