import { Entity, Column, PrimaryColumn, Index, CreateDateColumn } from 'typeorm';
import { Expose } from 'class-transformer';
import { dateTransformer } from '@common/utils/fechaColombia';

@Entity({ schema: 'pgfacture', name: 'pgx_role_scopes' })
@Index('pgx_role_scopes_pk', ['rs_role_id', 'rs_scope_id'], { unique: true })
@Index('pgx_role_scopes_fk1', ['rs_role_id'])
@Index('pgx_role_scopes_fk2', ['rs_scope_id'])
export class RoleScope {
    @PrimaryColumn({ name: 'rs_role_id', type: 'bigint' })
    @Expose({ name: 'role_id' })
    rs_role_id: number;

    @PrimaryColumn({ name: 'rs_scope_id', type: 'varchar', length: 50 })
    @Expose({ name: 'scope_id' })
    rs_scope_id: string;

    @CreateDateColumn({
        name: 'rs_created_at',
        type: 'timestamp',
        transformer: dateTransformer()
    })
    @Expose({ name: 'created_at' })
    rs_created_at: Date;
}