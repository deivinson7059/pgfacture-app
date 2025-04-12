import { Entity, Column, PrimaryColumn, Index } from 'typeorm';
import { Expose } from 'class-transformer';

@Entity({ schema: 'pgfacture', name: 'pgx_scopes' })
@Index('pgx_scopes_pk', ['s_id'], { unique: true })
export class Scope {
    @PrimaryColumn({ name: 's_id', type: 'varchar', length: 50 })
    @Expose({ name: 'id' })
    s_id: string;

    @Column({ name: 's_description', type: 'varchar', length: 200 })
    @Expose({ name: 'description' })
    s_description: string;

    @Column({ name: 's_active', type: 'int', default: 1 })
    @Expose({ name: 'active' })
    s_active: number;
}