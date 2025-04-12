import { Entity, Column, PrimaryColumn, CreateDateColumn, Index } from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { dateTransformer } from 'src/app/common/utils/fechaColombia';

@Entity({ schema: 'pgfacture', name: 'pgx_comments' })
@Index('pgx_comments_fk1', ['co_cmpy'])
@Index('pgx_comments_fk2', ['co_ware'])
@Index('pgx_comments_fk3', ['co_ref'])
@Index('pgx_comments_fk4', ['co_module'])
@Index('pgx_comments_fk5', ['co_cmpy', 'co_ware', 'co_module'])
@Index('pgx_comments_fk6', ['co_cmpy', 'co_ref', 'co_module'])
@Index('pgx_comments_fk7', ['co_ref2'])
@Index('pgx_comments_fk8', ['co_cmpy', 'co_ref2', 'co_module'])
export class Comment {
    @PrimaryColumn({ name: 'co_id', type: 'bigint' })
    @Expose({ name: 'id' })
    co_id: number;

    @PrimaryColumn({ name: 'co_cmpy', type: 'char', length: 10 })
    @Expose({ name: 'cmpy' })
    @Exclude()
    co_cmpy: string;

    @Column({ name: 'co_ware', type: 'varchar', length: 250 })
    @Expose({ name: 'ware' })
    @Exclude()
    co_ware: string;

    @Column({ name: 'co_ref', type: 'varchar', length: 60 })
    @Expose({ name: 'ref' })
    @Exclude()
    co_ref: string;

    @Column({ name: 'co_ref2', type: 'varchar', length: 60, nullable: true })
    @Expose({ name: 'ref2' })
    @Exclude()
    co_ref2: string | null;

    @Column({ name: 'co_module', type: 'varchar', length: 120 })
    @Expose({ name: 'module' })
    @Exclude()
    co_module: string;

    @Column({ name: 'co_comment', type: 'text', nullable: false })
    @Expose({ name: 'comment' })
    co_comment: string;

    @Column({ name: 'co_private', type: 'boolean', default: false })
    @Expose({ name: 'private' })
    co_private: boolean;

    @Column({ name: 'co_system_generated', type: 'boolean', default: false })
    @Expose({ name: 'system_generated' })
    co_system_generated: boolean;

    @CreateDateColumn({
        name: 'co_date_in',
        type: 'timestamp',
        precision: 6,
        transformer: dateTransformer()
    })
    @Expose({ name: 'date_in' })
    co_date_in: Date;

    @Column({ name: 'co_user_enter', type: 'varchar', length: 350 })
    @Expose({ name: 'user_enter' })
    co_user_enter: string;
}