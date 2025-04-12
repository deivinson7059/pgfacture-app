import { Entity, Column, PrimaryColumn, Index } from 'typeorm';
import { Exclude, Expose } from 'class-transformer';

@Entity({ schema: 'pgfacture', name: 'pg_cmpy' })
export class Company {
    @PrimaryColumn('bigint', { name: 'cmpy_n_id' })
    @Expose({ name: 'id' })
    @Exclude()
    cmpy_n_id: number;

    @Column('varchar', { name: 'cmpy_id', length: 10 })
    @Index('pg_cmpy_fk1')
    @Expose({ name: 'cmpy' })
    cmpy_id: string;

    @Column('bigint', { name: 'cmpy_type_document_identification_id' })
    @Expose({ name: 'type_document_identification_id' })
    cmpy_type_document_identification_id: number;

    @Column('varchar', { name: 'cmpy_type_document_identification', length: 191 })
    @Expose({ name: 'type_document_identification' })
    cmpy_type_document_identification: string;

    @Column('varchar', { name: 'cmpy_document_identification', length: 80 })
    @Index('pg_cmpy_fk2')
    @Expose({ name: 'document_identification' })
    cmpy_document_identification: string;

    @Column('char', { name: 'cmpy_dv', length: 1 })
    @Index('pg_cmpy_fk3')
    @Expose({ name: 'dv' })
    cmpy_dv: string;

    @Column('varchar', { name: 'cmpy_business_name', length: 300 })
    @Index('pg_cmpy_fk4')
    @Expose({ name: 'business_name' })
    cmpy_business_name: string;

    @Column('varchar', { name: 'cmpy_trading_name', length: 300 })
    @Index('pg_cmpy_fk5')
    @Expose({ name: 'trading_name' })
    cmpy_trading_name: string;

    @Column('varchar', { name: 'cmpy_trading_type', length: 60, default: 'none' })
    @Expose({ name: 'trading_type' })
    @Exclude()
    cmpy_trading_type: string;

    @Column('varchar', { name: 'cmpy_rep_id', length: 190 })
    @Expose({ name: 'rep_id' })
    cmpy_rep_id: string;

    @Column('varchar', { name: 'cmpy_actividad', length: 60, default: null })
    @Expose({ name: 'actividad' })
    @Exclude()
    cmpy_actividad: string;

    @Column('varchar', { name: 'cmpy_actividad_sec', length: 60, default: null })
    @Expose({ name: 'actividad_sec' })
    @Exclude()
    cmpy_actividad_sec: string;

    @Column('bigint', { name: 'cmpy_type_organization_id' })
    @Expose({ name: 'type_organization_id' })
    cmpy_type_organization_id: number;

    @Column('varchar', { name: 'cmpy_organization', length: 191 })
    @Expose({ name: 'organization' })
    cmpy_organization: string;

    @Column('bigint', { name: 'cmpy_type_regime_id' })
    @Expose({ name: 'type_regime_id' })
    cmpy_type_regime_id: number;

    @Column('varchar', { name: 'cmpy_regime', length: 191 })
    @Expose({ name: 'regime' })
    cmpy_regime: string;

    @Column('bigint', { name: 'cmpy_type_liability_id' })
    @Expose({ name: 'type_liability_id' })
    cmpy_type_liability_id: number;

    @Column('varchar', { name: 'cmpy_liability', length: 191 })
    @Expose({ name: 'liability' })
    cmpy_liability: string;

    @Column('varchar', { name: 'cmpy_merchant_registration', length: 191, default: '0000000-00' })
    @Expose({ name: 'merchant_registration' })
    @Exclude()
    cmpy_merchant_registration: string;

    @Column('bigint', { name: 'cmpy_dep_id' })
    @Expose({ name: 'dep_id' })
    cmpy_dep_id: number;

    @Column('varchar', { name: 'cmpy_dep', length: 250 })
    @Expose({ name: 'dep' })
    cmpy_dep: string;

    @Column('bigint', { name: 'cmpy_municipality_id' })
    @Expose({ name: 'municipality_id' })
    cmpy_municipality_id: number;

    @Column('varchar', { name: 'cmpy_municipality', length: 191 })
    @Expose({ name: 'municipality' })
    cmpy_municipality: string;

    @Column('varchar', { name: 'cmpy_dir', length: 300 })
    @Expose({ name: 'dir' })
    cmpy_dir: string;

    @Column('varchar', { name: 'cmpy_tel', length: 60 })
    @Expose({ name: 'tel' })
    cmpy_tel: string;

    @Column('varchar', { name: 'cmpy_postal_zone_code', length: 10, default: '080001' })
    @Expose({ name: 'postal_zone_code' })
    @Exclude()
    cmpy_postal_zone_code: string;

    @Column('bigint', { name: 'cmpy_country_id', default: 46 })
    @Expose({ name: 'country_id' })
    @Exclude()
    cmpy_country_id: number;

    @Column('varchar', { name: 'cmpy_country', length: 191, default: "Colombia" })
    @Expose({ name: 'country' })
    @Exclude()
    cmpy_country: string;

    @Column('varchar', { name: 'cmpy_email', length: 150 })
    @Expose({ name: 'email' })
    cmpy_email: string;

    @Column('char', { name: 'cmpy_restobar', length: 1, default: 'N' })
    @Expose({ name: 'restobar' })
    @Exclude()
    cmpy_restobar: string;

    @Column('varchar', { name: 'cmpy_letter', length: 5 })
    @Index('pg_cmpy_fk8')
    @Expose({ name: 'letter' })
    @Exclude()
    cmpy_letter: string;

    @Column('bigint', { name: 'cmpy_next', default: 0 })
    @Index('pg_cmpy_fk9')
    @Expose({ name: 'next' })
    @Exclude()
    cmpy_next: number;

    @Column('int', { name: 'cmpy_print_id', default: 1 })
    @Expose({ name: 'print_id' })
    @Exclude()
    cmpy_print_id: number;

    @Column('char', { name: 'cmpy_enabled', length: 2, default: 'Y' })
    @Index('pg_cmpy_fk7')
    @Expose({ name: 'enabled' })
    cmpy_enabled: string;

    @Column('varchar', { name: 'cmpy_api_dian', length: 191, default: 'https://dian.pgfacture.com' })
    @Index('pg_cmpy_fk16')
    @Expose({ name: 'api_dian' })
    @Exclude()
    cmpy_api_dian: string;

    @Column('varchar', { name: 'cmpy_api_token', length: 120, default: null })
    @Index('pg_cmpy_fk6')
    @Expose({ name: 'api_token' })
    @Exclude()
    cmpy_api_token: string;

    @Column('bigint', { name: 'cmpy_api_id', nullable: true, default: null })
    @Index('pg_cmpy_fk18')
    @Expose({ name: 'api_id' })
    @Exclude()
    cmpy_api_id: number;

    @Column('varchar', { name: 'cmpy_invoice_template', length: 10, default: '2' })
    @Index('pg_cmpy_fk19')
    @Expose({ name: 'invoice_template' })
    @Exclude()
    cmpy_invoice_template: string;

    @Column('varchar', { name: 'cmpy_pos_template', length: 10, default: '2' })
    @Expose({ name: 'pos_template' })
    @Exclude()
    cmpy_pos_template: string;

    @Column('varchar', { name: 'cmpy_template_token', length: 191, default: '' })
    @Index('pg_cmpy_fk17')
    @Expose({ name: 'template_token' })
    @Exclude()
    cmpy_template_token: string;

    @Column('char', { name: 'cmpy_fe_enabled', length: 1, default: 'N' })
    @Index('pg_cmpy_fk10')
    @Expose({ name: 'fe_enabled' })
    @Exclude()
    cmpy_fe_enabled: string;

    @Column('varchar', { name: 'cmpy_ne_enabled', length: 2, default: 'N' })
    @Index('pg_cmpy_fk11')
    @Expose({ name: 'ne_enabled' })
    @Exclude()
    cmpy_ne_enabled: string;

    @Column('varchar', { name: 'cmpy_ne_liqu', length: 15, default: 'Mensual' })
    @Expose({ name: 'ne_liqu' })
    @Exclude()
    cmpy_ne_liqu: string;

    @Column('varchar', { name: 'cmpy_fe_send_aut', length: 2, default: 'N' })
    @Index('pg_cmpy_fk12')
    @Expose({ name: 'fe_send_aut' })
    @Exclude()
    cmpy_fe_send_aut: string;

    @Column('varchar', { name: 'cmpy_show_users', length: 10, default: 'SI' })
    @Expose({ name: 'show_users' })
    @Exclude()
    cmpy_show_users: string;

    @Column('varchar', { name: 'cmpy_rount_prices', length: 10, default: 'SI' })
    @Expose({ name: 'rount_prices' })
    @Exclude()
    cmpy_rount_prices: string;

    @Column('varchar', { name: 'cmpy_over_tops', length: 10, default: 'SI' })
    @Expose({ name: 'over_tops' })
    @Exclude()
    cmpy_over_tops: string;

    @Column('varchar', { name: 'cmpy_online_store', length: 191, default: 'SI' })
    @Expose({ name: 'online_store' })
    @Exclude()
    cmpy_online_store: string;

    @Column('int', { name: 'cmpy_account', default: 5 })
    @Expose({ name: 'account' })
    @Exclude()
    cmpy_account: number;

    @Column('varchar', { name: 'cmpy_tax', length: 190, default: 'IVA' })
    @Index('pg_cmpy_fk13')
    @Expose({ name: 'tax' })
    @Exclude()
    cmpy_tax: string;

    @Column('decimal', { name: 'cmpy_uvt', precision: 30, scale: 2, default: 0.00 })
    @Index('pg_cmpy_fk14')
    @Expose({ name: 'uvt' })
    @Exclude()
    cmpy_uvt: number;

    @Column('varchar', { name: 'cmpy_inv', length: 80, default: "00" })
    @Index('pg_cmpy_fk15')
    @Expose({ name: 'inv' })
    @Exclude()
    cmpy_inv: string;

    @Column('bigint', { name: 'cmpy_pln_id', default: 2 })
    @Expose({ name: 'pln_id' })
    @Exclude()
    cmpy_pln_id: number;

    @Column('varchar', { name: 'cmpy_pay_ret', length: 2, default: 'Y' })
    @Expose({ name: 'pay_ret' })
    @Exclude()
    cmpy_pay_ret: string;

    @Column('varchar', { name: 'cmpy_pay_ref', length: 2, default: 'N' })
    @Expose({ name: 'pay_ref' })
    @Exclude()
    cmpy_pay_ref: string;

    @Column('varchar', { name: 'cmpy_ter_edit', length: 2, default: 'Y' })
    @Expose({ name: 'ter_edit' })
    @Exclude()
    cmpy_ter_edit: string;

    @Column('timestamp', { name: 'cmpy_pln_start_date', nullable: true })
    @Expose({ name: 'pln_start_date' })
    cmpy_pln_start_date: Date;

    @Column('timestamp', { name: 'cmpy_pln_end_date', nullable: true })
    @Expose({ name: 'pln_end_date' })
    cmpy_pln_end_date: Date;

    @Column('varchar', { name: 'cmpy_pay', length: 60, default: 'ANUAL' })
    @Expose({ name: 'pay' })
    @Exclude()
    cmpy_pay: string;
}