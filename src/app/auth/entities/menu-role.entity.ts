import { Entity, Column, PrimaryColumn, Index } from 'typeorm';
import { Expose } from 'class-transformer';

@Entity({ schema: 'pgfacture', name: 'pgx_menu_roles' })
@Index('pgx_menu_roles_pk', ['mr_cmpy', 'mr_rol_id', 'mr_menu_id', 'mr_menu_options_id'], { unique: true })
@Index('mr_id', ['mr_id'], { unique: true })
@Index('pg_menu_roles_fk1', ['mr_cmpy'])
@Index('pg_menu_roles_fk2', ['mr_rol_id', 'mr_cmpy'])
@Index('pg_menu_roles_fk3', ['mr_rol_id'])
@Index('pg_menu_roles_fk4', ['mr_menu_id'])
@Index('pg_menu_roles_fk5', ['mr_menu_options_id'])
export class MenuRole {
    @PrimaryColumn({ name: 'mr_id', type: 'int' })
    @Expose({ name: 'id' })
    mr_id: number;

    @PrimaryColumn({ name: 'mr_cmpy', type: 'char', length: 10 })
    @Expose({ name: 'cmpy' })
    mr_cmpy: string;

    @PrimaryColumn({ name: 'mr_rol_id', type: 'varchar', length: 200 })
    @Expose({ name: 'role_id' })
    mr_rol_id: string;

    @PrimaryColumn({ name: 'mr_menu_id', type: 'int' })
    @Expose({ name: 'menu_id' })
    mr_menu_id: number;

    @PrimaryColumn({ name: 'mr_menu_options_id', type: 'int' })
    @Expose({ name: 'menu_option_id' })
    mr_menu_options_id: number;

    @Column({ name: 'mr_menu_options_title', type: 'varchar', length: 120 })
    @Expose({ name: 'menu_option_title' })
    mr_menu_options_title: string;
}