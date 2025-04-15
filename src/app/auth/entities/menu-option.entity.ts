import { Entity, Column, PrimaryColumn, Index } from 'typeorm';
import { Expose } from 'class-transformer';

@Entity({ schema: 'pgfacture', name: 'pgx_menu_options' })
@Index('pgx_menu_options_pk', ['mo_id'], { unique: true })
@Index('pgx_menu_options_fk1', ['mo_menu_id'])
@Index('pgx_menu_options_fk2', ['mo_parent_id'])
@Index('pgx_menu_options_fk3', ['mo_menu_id', 'mo_parent_id'])
export class MenuOption {
    @PrimaryColumn({ name: 'mo_id', type: 'int' })
    @Expose({ name: 'id' })
    mo_id: number;

    @Column({ name: 'mo_menu_id', type: 'int' })
    @Expose({ name: 'menu_id' })
    mo_menu_id: number;

    @Column({ name: 'mo_parent_id', type: 'int', nullable: true })
    @Expose({ name: 'parent_id' })
    mo_parent_id: number | null;

    @Column({ name: 'mo_title', type: 'varchar', length: 120 })
    @Expose({ name: 'title' })
    mo_title: string;

    @Column({ name: 'mo_path', type: 'varchar', length: 250 })
    @Expose({ name: 'path' })
    mo_path: string;

    @Column({ name: 'mo_icon', type: 'varchar', length: 60, nullable: true })
    @Expose({ name: 'icon' })
    mo_icon: string | null;

    @Column({ name: 'mo_class', type: 'varchar', length: 60, nullable: true })
    @Expose({ name: 'class' })
    mo_class: string | null;

    @Column({ name: 'mo_level', type: 'int', default: 1 })
    @Expose({ name: 'level' })
    mo_level: number;

    @Column({ name: 'mo_order', type: 'int', default: 1 })
    @Expose({ name: 'order' })
    mo_order: number;

    @Column({ name: 'mo_is_group_title', type: 'boolean', default: false })
    @Expose({ name: 'is_group_title' })
    mo_is_group_title: boolean;

    @Column({ name: 'mo_enabled', type: 'char', length: 1, default: 'Y' })
    @Expose({ name: 'enabled' })
    mo_enabled: string;
}