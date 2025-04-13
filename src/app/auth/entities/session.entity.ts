import { Entity, Column, PrimaryColumn, Index, CreateDateColumn } from 'typeorm';
import { Expose } from 'class-transformer';
import { dateTransformer } from '@common/utils/fechaColombia';

@Entity({ schema: 'pgfacture', name: 'pgx_sessions' })
@Index('pgx_sessions_pk', ['se_id'], { unique: true })
@Index('pgx_sessions_fk1', ['se_user_id'])
@Index('pgx_sessions_fk2', ['se_platform_id'])
@Index('pgx_sessions_fk3', ['se_token'])
@Index('pgx_sessions_fk4', ['se_cmpy', 'se_user_id', 'se_platform_id'])
export class Session {
    @PrimaryColumn({ name: 'se_id', type: 'varchar', length: 90 })
    @Expose({ name: 'id' })
    se_id: string;

    @Column({ name: 'se_cmpy', type: 'varchar', length: 10 })
    @Expose({ name: 'cmpy' })
    se_cmpy: string;

    @Column({ name: 'se_ware', type: 'varchar', length: 200 })
    @Expose({ name: 'ware' })
    se_ware: string;

    @Column({ name: 'se_user_id', type: 'bigint' })
    @Expose({ name: 'user_id' })
    se_user_id: number;

    @Column({ name: 'se_platform_id', type: 'int' })
    @Expose({ name: 'platform_id' })
    se_platform_id: number;

    @Column({ name: 'se_ip_address', type: 'varchar', length: 90 })
    @Expose({ name: 'ip_address' })
    se_ip_address: string;

    @Column({ name: 'se_user_agent', type: 'varchar', length: 3000 })
    @Expose({ name: 'user_agent' })
    se_user_agent: string;

    @Column({ name: 'se_device_info', type: 'varchar', length: 3000, nullable: true, default: '--' })
    @Expose({ name: 'device_info' })
    se_device_info: string;

    @Column({ name: 'se_token', type: 'varchar', length: 3000 })
    @Expose({ name: 'token' })
    se_token: string;

    @CreateDateColumn({
        name: 'se_created_at',
        type: 'timestamp',
        transformer: dateTransformer()
    })
    @Expose({ name: 'created_at' })
    se_created_at: Date;

    @Column({
        name: 'se_expires',
        type: 'timestamp',
        transformer: dateTransformer()
    })
    @Expose({ name: 'expires' })
    se_expires: Date;
}