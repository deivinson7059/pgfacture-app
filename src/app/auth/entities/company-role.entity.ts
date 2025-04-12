import { Entity, Column, PrimaryColumn, Index, CreateDateColumn } from 'typeorm';
import { Expose } from 'class-transformer';
import { dateTransformer } from '@common/utils/fechaColombia';

@Entity({ schema: 'pgfacture', name: 'pg_company_roles' })
@Index('pg_company_roles_pk', ['cr_id', 'cr_cmpy'], { unique: true })
@Index('pg_company_roles_fk1', ['cr_cmpy'])
export class CompanyRole {
    @PrimaryColumn({ name: 'cr_id', type: 'varchar', length: 50 })
    @Expose({ name: 'id' })
    cr_id: string;

    @PrimaryColumn({ name: 'cr_cmpy', type: 'varchar', length: 10 })
    @Expose({ name: 'company_id' })
    cr_cmpy: string;

    @Column({ name: 'cr_name', type: 'varchar', length: 100 })
    @Expose({ name: 'name' })
    cr_name: string;

    @Column({ name: 'cr_description', type: 'varchar', length: 200, nullable: true })
    @Expose({ name: 'description' })
    cr_description: string | null;

    @Column({ name: 'cr_active', type: 'int', default: 1 })
    @Expose({ name: 'active' })
    cr_active: number;

    @CreateDateColumn({
        name: 'cr_created_at',
        type: 'timestamp',
        transformer: dateTransformer()
    })
    @Expose({ name: 'created_at' })
    cr_created_at: Date;
}