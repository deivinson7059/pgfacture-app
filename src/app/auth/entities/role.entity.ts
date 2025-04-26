import { Entity, Column, PrimaryColumn, Index } from 'typeorm';
import { Expose, Exclude } from 'class-transformer';

@Entity({ schema: 'pgfacture', name: 'pgx_roles' })
@Index('pgx_roles_pk', ['rol_id'], { unique: true })
export class Role {
    @PrimaryColumn({ name: 'rol_id', type: 'varchar', length: 50 })
    @Expose({ name: 'id' })
    rol_id: string;

    @Column({ name: 'rol_name', type: 'varchar', length: 200, unique: true })
    @Expose({ name: 'name' })
    rol_name: string;

    @Column({ name: 'rol_description', type: 'varchar', length: 500, nullable: true })
    @Expose({ name: 'description' })
    rol_description: string;

    @Column({ name: 'rol_path', type: 'varchar', length: 60, default: 'user' })
    @Expose({ name: 'path' })
    rol_path: string;

    @Column({ name: 'rol_enabled', type: 'char', length: 1, default: 'Y' })
    @Exclude()
    rol_enabled: string;
}