import { Entity, Column, PrimaryColumn, Index, UpdateDateColumn } from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { dateTransformer } from '@common/utils/fechaColombia';

@Entity({ schema: 'pgfacture', name: 'pgx_customers' })
export class Customer {
    @Column('bigint', { name: 'cust_id', primary: true })
    @Index('pgx_customers_fk5')
    @Exclude()
    @Expose({ name: 'id' })
    cust_id: number;

    @PrimaryColumn('varchar', { name: 'cust_cmpy', length: 10 })
    @Index('pgx_customers_fk1')
    @Expose({ name: 'cmpy' })
    cust_cmpy: string;

    @Column('varchar', { name: 'cust_active', length: 2, default: 'Y' })
    @Index('pgx_customers_fk8')
    @Exclude()
    @Expose({ name: 'active' })
    cust_active?: string;

    @PrimaryColumn('varchar', { name: 'cust_identification_number', length: 30 })
    @Index('pgx_customers_fk2')
    @Expose({ name: 'identification_number' })
    cust_identification_number: string;

    @Column('varchar', { name: 'cust_dv', length: 1, nullable: true })
    @Expose({ name: 'dv' })
    cust_dv: string;

    @Column('bigint', { name: 'cust_type_document_identification_id' })
    @Expose({ name: 'type_document_identification_id' })
    cust_type_document_identification_id: number;

    @Column('varchar', { name: 'cust_type_document_identification', length: 191 })
    @Expose({ name: 'type_document_identification' })
    cust_type_document_identification: string;

    @Column('bigint', { name: 'cust_type_organization_id' })
    @Expose({ name: 'type_organization_id' })
    cust_type_organization_id: number;

    @Column('varchar', { name: 'cust_type_organization', length: 191 })
    @Expose({ name: 'type_organization' })
    cust_type_organization: string;

    @Column('bigint', { name: 'cust_type_regime_id' })
    @Expose({ name: 'type_regime_id' })
    cust_type_regime_id: number;

    @Column('varchar', { name: 'cust_type_regime', length: 191 })
    @Expose({ name: 'type_regime' })
    cust_type_regime: string;

    @Column('bigint', { name: 'cust_type_liability_id' })
    @Expose({ name: 'type_liability_id' })
    cust_type_liability_id: number;

    @Column('varchar', { name: 'cust_type_liability', length: 191 })
    @Expose({ name: 'type_liability' })
    cust_type_liability: string;

    @Column('varchar', { name: 'cust_name', length: 120, nullable: true })
    @Index('pgx_customers_fk4')
    @Expose({ name: 'name' })
    cust_name: string;

    @Column('varchar', { name: 'cust_given_names', length: 120, nullable: true })
    @Expose({ name: 'given_names' })
    cust_given_names: string;

    @Column('varchar', { name: 'cust_family_names', length: 120, nullable: true })
    @Expose({ name: 'family_names' })
    cust_family_names: string;

    @Column('varchar', { name: 'cust_contact_name', length: 120, nullable: true })
    @Expose({ name: 'contact_name' })
    cust_contact_name: string;

    @Column('varchar', { name: 'cust_adinfo', length: 500, nullable: true })
    @Expose({ name: 'additional_info' })
    cust_adinfo: string;

    @Column('varchar', { name: 'cust_email', length: 120, nullable: true })
    @Expose({ name: 'email' })
    cust_email: string;

    @Column('varchar', { name: 'cust_address', length: 120, nullable: true })
    @Expose({ name: 'address' })
    cust_address: string;

    @Column('bigint', { name: 'cust_municipality_id' })
    @Expose({ name: 'municipality_id' })
    cust_municipality_id: number;

    @Column('varchar', { name: 'cust_municipality', length: 191 })
    @Expose({ name: 'municipality' })
    cust_municipality: string;

    @Column('bigint', { name: 'cust_dep_id' })
    @Expose({ name: 'dep_id' })
    cust_dep_id: number;

    @Column('varchar', { name: 'cust_dep', length: 250, nullable: true })
    @Expose({ name: 'dep' })
    cust_dep: string;

    @Column('bigint', { name: 'cust_country_id' })
    @Expose({ name: 'country_id' })
    cust_country_id: number;

    @Column('varchar', { name: 'cust_country', length: 191 })
    @Expose({ name: 'country' })
    cust_country: string;

    @Column('varchar', { name: 'cust_phone', length: 30, nullable: true })
    @Expose({ name: 'phone' })
    cust_phone: string;

    @Column('varchar', { name: 'cust_mobile', length: 30, nullable: true })
    @Expose({ name: 'mobile' })
    cust_mobile: string;

    @Column('varchar', { name: 'cust_pass', length: 300, nullable: true })
    @Expose({ name: 'password' })
    @Exclude()
    cust_pass: string;

    @Column('varchar', { name: 'cust_newpass', length: 300, nullable: true })
    @Expose({ name: 'new_password' })
    @Exclude()
    cust_newpass: string;

    @Column('varchar', { name: 'cust_auth', length: 300 })
    @Expose({ name: 'auth' })
    cust_auth: string;

    @Column({
        name: 'cust_created_at',
        type: 'timestamp',
        precision: 6,
        nullable: true,
        transformer: dateTransformer()
    })
    @Expose({ name: 'created_at' })
    created_at: Date;

    @UpdateDateColumn({
        name: 'cust_updated_at',
        type: 'timestamp',
        precision: 6,
        nullable: true,
        transformer: dateTransformer()
    })
    @Expose({ name: 'updated_at' })
    updated_at: Date;
}