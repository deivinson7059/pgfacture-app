import { Entity, Column, PrimaryColumn, Index } from 'typeorm';
import { Expose } from 'class-transformer';

@Entity({ schema: 'pgfacture', name: 'pgx_platforms' })
@Index('pgx_platforms_pk', ['p_id'], { unique: true })
export class Platform {
    @PrimaryColumn({ name: 'p_id', type: 'int' })
    @Expose({ name: 'id' })
    p_id: number;

    @Column({ name: 'p_name', type: 'varchar', length: 50, unique: true })
    @Expose({ name: 'name' })
    p_name: string;

    @Column({ name: 'p_description', type: 'varchar', length: 200 })
    @Expose({ name: 'description' })
    p_description: string;

    @Column({ name: 'p_enabled', type: 'char', length: 1, default: 'Y' })
    @Expose({ name: 'enabled' })
    p_enabled: string;
}