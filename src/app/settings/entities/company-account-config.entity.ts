import { Entity, Column, PrimaryGeneratedColumn, Index, PrimaryColumn } from 'typeorm';
import { Exclude, Expose } from 'class-transformer';

@Entity({ schema: 'pgfacture', name: 'cmpy_account_config' })
export class CompanyAccountConfig {
    @PrimaryColumn()
    @Column('varchar', { name: 'acc_cmpy', length: 10 })
    @Index('cmpy_account_config_fk1')
    @Expose({ name: 'cmpy' })
    acc_cmpy: string;

    @Column('int', { name: 'acc_order' })
    @Expose({ name: 'order' })
    acc_order: number;

    @PrimaryColumn()
    @Column('varchar', { name: 'acc_number', length: 20 })
    @Expose({ name: 'account_number' })
    acc_number: string;

    @Column('varchar', { name: 'acc_description', length: 255 })
    @Expose({ name: 'description' })
    acc_description: string;

    @Column('varchar', { name: 'acc_modules', length: 255 })
    @Expose({ name: 'modules' })
    acc_modules: string;

    @Column('varchar', { name: 'acc_type', length: 10 })
    @Expose({ name: 'type' })
    acc_type: string; // 'CR' para crédito, 'DB' para débito
}