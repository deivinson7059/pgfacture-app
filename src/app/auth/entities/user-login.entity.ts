import { Entity, Column, PrimaryColumn, Index } from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { dateTransformer } from '@common/utils/fechaColombia';

@Entity({ schema: 'pgfacture', name: 'pg_users' })
@Index('pg_users_fk0', ['u_person_identification_number'])
@Index('pg_users_fk1', ['u_person_email'])
@Index('pg_users_fk2', ['u_token'])
@Index('pg_users_fk3', ['u_pass'])
@Index('pg_users_fk4', ['u_active'])
@Index('pg_users_fk5', ['u_person_name'])
@Index('pg_users_fk6', ['u_person_identification_number', 'u_token', 'u_pass', 'u_active', 'u_person_name'])
export class UserLogin {
    @PrimaryColumn({ name: 'u_id', type: 'bigint' })
    @Expose({ name: 'id' })
    u_id: number;

    @Column({ name: 'u_person_email', type: 'varchar', length: 190 })
    @Expose({ name: 'email' })
    u_person_email: string;

    @Column({ name: 'u_person_identification_number', type: 'varchar', length: 30, unique: true })
    @Expose({ name: 'identification_number' })
    u_person_identification_number: string;

    @Column({ name: 'u_person_name', type: 'varchar', length: 120 })
    @Expose({ name: 'name' })
    u_person_name: string;

    @Column({ name: 'u_pass', type: 'varchar', length: 300 })
    @Expose({ name: 'password' })
    @Exclude()
    u_pass: string;

    @Column({ name: 'u_token', type: 'varchar', length: 300 })
    @Expose({ name: 'token' })
    u_token: string;

    @Column({ name: 'u_locked', type: 'int', default: 0 })
    @Expose({ name: 'locked' })
    u_locked: number;

    @Column({
        name: 'u_date_locked',
        type: 'timestamp',
        precision: 6,
        nullable: true,
        transformer: dateTransformer()
    })
    @Expose({ name: 'date_locked' })
    u_date_locked: Date | null;

    @Column({ name: 'u_reason_locked', type: 'varchar', length: 45, nullable: true })
    @Expose({ name: 'reason_locked' })
    u_reason_locked: string | null;

    @Column({ name: 'u_active', type: 'int', default: 1 })
    @Expose({ name: 'active' })
    u_active: number;

    @Column({ name: 'u_notes', type: 'varchar', length: 300, nullable: true })
    @Expose({ name: 'notes' })
    u_notes: string | null;
}