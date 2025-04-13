import { Entity, Column, PrimaryColumn, Index, CreateDateColumn } from 'typeorm';
import { Expose } from 'class-transformer';
import { dateTransformer } from '@common/utils/fechaColombia';

@Entity({ schema: 'pgfacture', name: 'pgx_users_cmpy' })
@Index('pgx_users_cmpy_fk1', ['uc_person_identification_number'])
@Index('pgx_users_cmpy_fk2', ['uc_person_name'])
@Index('pgx_users_cmpy_fk3', ['uc_ware'])
@Index('pgx_users_cmpy_fk4', ['uc_cmpy'])
@Index('pgx_users_cmpy_fk5', ['uc_enabled'])
@Index('pgx_users_cmpy_fk6', ['uc_person_identification_number', 'uc_person_name', 'uc_ware', 'uc_cmpy', 'uc_enabled'])
@Index('pgx_users_cmpy_fk7', ['uc_role_id'])
@Index('pgx_users_cmpy_fk8', ['uc_token'])
export class UserCompany {
    @Column({ name: 'uc_id', type: 'bigint' })
    @Expose({ name: 'id' })
    uc_id: number;

    @PrimaryColumn({ name: 'uc_person_identification_number', type: 'varchar', length: 30 })
    @Expose({ name: 'identification_number' })
    uc_person_identification_number: string;

    @Column({ name: 'uc_person_name', type: 'varchar', length: 120 })
    @Expose({ name: 'person_name' })
    uc_person_name: string;

    @Column({ name: 'uc_person_nick', type: 'varchar', length: 190, nullable: true })
    @Expose({ name: 'nick' })
    uc_person_nick: string | null;

    @PrimaryColumn({ name: 'uc_cmpy', type: 'varchar', length: 10 })
    @Expose({ name: 'cmpy' })
    uc_cmpy: string;

    @PrimaryColumn({ name: 'uc_ware', type: 'varchar', length: 200 })
    @Expose({ name: 'ware' })
    uc_ware: string;

    @Column({ name: 'uc_enabled', type: 'int', default: 1 })
    @Expose({ name: 'enabled' })
    uc_enabled: number;

    @Column({ name: 'uc_role_id', type: 'bigint' })
    @Expose({ name: 'role_id' })
    uc_role_id: number;

    @Column({ name: 'uc_ware_rol', type: 'varchar', length: 200 })
    @Expose({ name: 'role_name' })
    uc_ware_rol: string;

    @Column({ name: 'uc_ware_lista', type: 'varchar', length: 10 })
    @Expose({ name: 'list' })
    uc_ware_lista: string;

    @Column({ name: 'uc_ware_com_1', type: 'decimal', precision: 30, scale: 2, default: 0 })
    @Expose({ name: 'commission_1' })
    uc_ware_com_1: number;

    @Column({ name: 'uc_ware_com_2', type: 'decimal', precision: 30, scale: 2, default: 0 })
    @Expose({ name: 'commission_2' })
    uc_ware_com_2: number;

    @Column({ name: 'uc_ware_com_3', type: 'decimal', precision: 30, scale: 2, default: 0 })
    @Expose({ name: 'commission_3' })
    uc_ware_com_3: number;

    @Column({ name: 'uc_ware_dev', type: 'varchar', length: 2, default: 'Y' })
    @Expose({ name: 'can_return' })
    uc_ware_dev: string;

    @Column({ name: 'uc_token', type: 'varchar', length: 300, nullable: true })
    @Expose({ name: 'token' })
    uc_token: string | null;

    @CreateDateColumn({
        name: 'uc_now',
        type: 'timestamp',
        transformer: dateTransformer()
    })
    @Expose({ name: 'created_at' })
    uc_now: Date;
}