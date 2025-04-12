import { Entity, Column, PrimaryColumn, Index } from 'typeorm';
import { Exclude, Expose } from 'class-transformer';

@Entity({ schema: 'pgfacture', name: 'pgx_cmpy_payroll' })
export class CompanyPayrollConfig {
    @PrimaryColumn('varchar', { name: 'pay_cmpy', length: 10 })
    @Index('cmpy_payroll_config_fk1')
    @Expose({ name: 'cmpy' })
    pay_cmpy: string;

    @PrimaryColumn('varchar', { name: 'pay_concept', length: 100 })
    @Expose({ name: 'concept' })
    pay_concept: string;

    @Column('varchar', { name: 'pay_db_account', length: 20 })
    @Expose({ name: 'db_account' })
    pay_db_account: string;

    @Column('varchar', { name: 'pay_db_description', length: 255 })
    @Expose({ name: 'db_description' })
    pay_db_description: string;

    @Column('varchar', { name: 'pay_cr_account', length: 20, nullable: true })
    @Expose({ name: 'cr_account' })
    pay_cr_account: string;

    @Column('varchar', { name: 'pay_cr_description', length: 255, nullable: true })
    @Expose({ name: 'cr_description' })
    pay_cr_description: string;

    @Column('varchar', { name: 'pay_type', length: 10 })
    @Expose({ name: 'type' })
    pay_type: string; // DB, CR, o DB/CR

    @Column('varchar', { name: 'pay_third_type', length: 20 })
    @Expose({ name: 'third_type' })
    pay_third_type: string; // Empleado, EPS/Fondo
}