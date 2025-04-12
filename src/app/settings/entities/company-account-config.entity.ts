import { Entity, Column, PrimaryColumn, Index } from 'typeorm';
import { Exclude, Expose } from 'class-transformer';

@Entity({ schema: 'pgfacture', name: 'pgx_cmpy_account' })
export class CompanyAccountConfig {
    @PrimaryColumn('varchar', { name: 'acc_cmpy', length: 10 })
    @Index('cmpy_account_config_fk1')
    @Expose({ name: 'cmpy' })
    acc_cmpy: string;

    @PrimaryColumn('varchar', { name: 'acc_number', length: 20 })
    @Expose({ name: 'account_number' })
    acc_number: string;

    @Column('int', { name: 'acc_level' })
    @Expose({ name: 'level' })
    acc_level: number;

    @Column('varchar', { name: 'acc_description', length: 255 })
    @Expose({ name: 'description' })
    acc_description: string;

    @Column('varchar', { name: 'acc_modules', length: 255 })
    @Expose({ name: 'modules' })
    acc_modules: string;

    @Column('varchar', { name: 'acc_type', length: 10 })
    @Expose({ name: 'type' })
    acc_type: string; // 'CR' para crédito, 'DB' para débito, 'DB/CR' para ambos
}