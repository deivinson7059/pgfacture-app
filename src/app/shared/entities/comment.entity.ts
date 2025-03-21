import { Entity, Column, PrimaryColumn, CreateDateColumn, Index } from 'typeorm';
import { Expose } from 'class-transformer';
import { dateTransformer } from 'src/app/common/utils/fechaColombia';

@Entity({ schema: 'pgfacture', name: 'pg_comments' })
@Index('pg_comments_fk1', ['co_cmpy'])
@Index('pg_comments_fk2', ['co_ware'])
@Index('pg_comments_fk3', ['co_ref'])
@Index('pg_comments_fk4', ['co_table'])
@Index('pg_comments_fk5', ['co_cmpy', 'co_ware', 'co_table'])
export class Comment {
    @PrimaryColumn({ name: 'co_id', type: 'bigint' })
    @Expose({ name: 'id' })
    co_id: number;

    @PrimaryColumn({ name: 'co_cmpy', type: 'char', length: 10 })
    @Expose({ name: 'cmpy' })
    co_cmpy: string;

    @Column({ name: 'co_ware', type: 'varchar', length: 250 })
    @Expose({ name: 'ware' })
    co_ware: string;

    @Column({ name: 'co_ref', type: 'varchar', length: 60 })
    @Expose({ name: 'ref' })
    co_ref: string;

    @Column({ name: 'co_table', type: 'varchar', length: 120 })
    @Expose({ name: 'table' })
    co_table: string;

    @Column({ name: 'co_comment', type: 'text', nullable: false })
    @Expose({ name: 'comment' })
    co_comment: string;

    @CreateDateColumn({
        name: 'co_date_in',
        type: 'timestamp',
        precision: 6,
        transformer: dateTransformer()
    })
    @Expose({ name: 'date_in' })
    co_date_in: Date;

    @Column({ name: 'co_enter', type: 'varchar', length: 300 })
    @Expose({ name: 'enter' })
    co_enter: string;

    @Column({ name: 'co_user_enter', type: 'varchar', length: 350 })
    @Expose({ name: 'user_enter' })
    co_user_enter: string;
}