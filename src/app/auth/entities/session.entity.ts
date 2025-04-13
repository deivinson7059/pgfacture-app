import { Entity, Column, PrimaryColumn, Index, CreateDateColumn } from 'typeorm';
import { Expose } from 'class-transformer';
import { dateTransformer } from '@common/utils/fechaColombia';

@Entity({ schema: 'pgfacture', name: 'pgx_sessions' })
@Index('pgx_sessions_pk', ['s_id'], { unique: true })
@Index('pgx_sessions_fk1', ['s_user_id'])
@Index('pgx_sessions_fk2', ['s_platform_id'])
@Index('pgx_sessions_fk3', ['s_token'])
@Index('pgx_sessions_fk4', ['s_user_id', 's_platform_id'])
export class Session {
    @PrimaryColumn({ name: 's_id', type: 'bigint' })
    @Expose({ name: 'id' })
    s_id: number;

    @Column({ name: 's_cmpy', type: 'varchar', length: 10 })
    @Expose({ name: 'cmpy' })
    s_cmpy: string;

    @Column({ name: 's_ware', type: 'varchar', length: 200 })
    @Expose({ name: 'ware' })
    s_ware: string;

    @Column({ name: 's_user_id', type: 'bigint' })
    @Expose({ name: 'user_id' })
    s_user_id: number;

    @Column({ name: 's_platform_id', type: 'int' })
    @Expose({ name: 'platform_id' })
    s_platform_id: number;

    @Column({ name: 's_ip_address', type: 'varchar', length: 90 })
    @Expose({ name: 'ip_address' })
    s_ip_address: string;

    @Column({ name: 's_user_agent', type: 'varchar', length: 3000 })
    @Expose({ name: 'user_agent' })
    s_user_agent: string;

    @Column({ name: 's_device_info', type: 'varchar', length: 3000, nullable: true, default: '--' })
    @Expose({ name: 'device_info' })
    s_device_info: string;

    @Column({ name: 's_token', type: 'varchar', length: 3000 })
    @Expose({ name: 'token' })
    s_token: string;

    @CreateDateColumn({
        name: 's_created_at',
        type: 'timestamp',
        transformer: dateTransformer()
    })
    @Expose({ name: 'created_at' })
    s_created_at: Date;

    @Column({
        name: 's_last_activity',
        type: 'timestamp',
        transformer: dateTransformer()
    })
    @Expose({ name: 'last_activity' })
    s_last_activity: Date;

    @Column({ name: 's_active', type: 'char', length: 1, default: 'Y' })
    @Expose({ name: 'active' })
    s_active: string;
}