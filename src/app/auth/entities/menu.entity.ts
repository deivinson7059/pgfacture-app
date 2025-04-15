import { Entity, Column, PrimaryColumn, Index } from 'typeorm';
import { Expose } from 'class-transformer';

@Entity({ schema: 'pgfacture', name: 'pgx_menu' })
@Index('pgx_menu_pk', ['m_id'], { unique: true })
export class Menu {
    @PrimaryColumn({ name: 'm_id', type: 'int' })
    @Expose({ name: 'id' })
    m_id: number;

    @Column({ name: 'm_title', type: 'varchar', length: 120 })
    @Expose({ name: 'title' })
    m_title: string;

    @Column({ name: 'm_icon', type: 'varchar', length: 60 })
    @Expose({ name: 'icon' })
    m_icon: string;

    @Column({ name: 'm_order', type: 'int' })
    @Expose({ name: 'order' })
    m_order: number;

    @Column({ name: 'm_enabled', type: 'char', length: 1, default: 'Y' })
    @Expose({ name: 'enabled' })
    m_enabled: string;
}