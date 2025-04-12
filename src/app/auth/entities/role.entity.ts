import { Entity, Column, PrimaryColumn, Index } from 'typeorm';
import { Expose } from 'class-transformer';

@Entity({ schema: 'pgfacture', name: 'pgx_roles' })
@Index('pgx_roles_pk', ['rol_id'], { unique: true })
export class Role {
    @PrimaryColumn({ name: 'rol_id', type: 'bigint' })
    @Expose({ name: 'id' })
    rol_id: number;

    @Column({ name: 'rol_name', type: 'varchar', length: 200, unique: true })
    @Expose({ name: 'name' })
    rol_name: string;

    @Column({ name: 'rol_path', type: 'varchar', length: 60, default: 'user' })
    @Expose({ name: 'path' })
    rol_path: string;

    @Column({ name: 'rol_enabled', type: 'char', length: 1, default: 'Y' })
    @Expose({ name: 'enabled' })
    rol_enabled: string;
}