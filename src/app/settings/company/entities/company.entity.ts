import { Entity, Column, PrimaryColumn, Index } from 'typeorm';
import { Exclude, Expose } from 'class-transformer';

@Entity({ schema: 'pgfacture', name: 'pg_cmpy' }) // Nombre de la tabla en la base de datos
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

    // Cuentas contables
    @Column('varchar', { name: 'cmpy_acc1', length: 20, default: '41352805' })
    @Expose({ name: 'acc1' })
    @Exclude()
    cmpy_acc1: string;

    @Column('varchar', { name: 'cmpy_acc2', length: 20, default: '41352815' })
    @Expose({ name: 'acc2' })
    @Exclude()
    cmpy_acc2: string;

    @Column('varchar', { name: 'cmpy_acc3', length: 20, default: '41352810' })
    @Expose({ name: 'acc3' })
    @Exclude()
    cmpy_acc3: string;

    @Column('varchar', { name: 'cmpy_acc4', length: 20, default: '613528' })
    @Expose({ name: 'acc4' })
    @Exclude()
    cmpy_acc4: string;

    @Column('varchar', { name: 'cmpy_acc5', length: 20, default: '14350105' })
    @Expose({ name: 'acc5' })
    @Exclude()
    cmpy_acc5: string;

    @Column('varchar', { name: 'cmpy_acc6', length: 20, default: '14350110' })
    @Expose({ name: 'acc6' })
    @Exclude()
    cmpy_acc6: string;

    @Column('varchar', { name: 'cmpy_acc7', length: 20, default: '14300105' })
    @Expose({ name: 'acc7' })
    @Exclude()
    cmpy_acc7: string;

    @Column('varchar', { name: 'cmpy_acc8', length: 20, default: '14300110' })
    @Expose({ name: 'acc8' })
    @Exclude()
    cmpy_acc8: string;

    @Column('varchar', { name: 'cmpy_acc9', length: 20, default: '143005' })
    @Expose({ name: 'acc9' })
    @Exclude()
    cmpy_acc9: string;

    @Column('varchar', { name: 'cmpy_acc10', length: 20, default: '146510' })
    @Expose({ name: 'acc10' })
    @Exclude()
    cmpy_acc10: string;

    @Column('varchar', { name: 'cmpy_acc11', length: 20, default: '14350205' })
    @Expose({ name: 'acc11' })
    @Exclude()
    cmpy_acc11: string;

    @Column('varchar', { name: 'cmpy_acc12', length: 20, default: '14350210' })
    @Expose({ name: 'acc12' })
    @Exclude()
    cmpy_acc12: string;

    @Column('varchar', { name: 'cmpy_acc13', length: 20, default: '14350215' })
    @Expose({ name: 'acc13' })
    @Exclude()
    cmpy_acc13: string;

    @Column('varchar', { name: 'cmpy_acc14', length: 20, default: '140502' })
    @Expose({ name: 'acc14' })
    @Exclude()
    cmpy_acc14: string;

    @Column('varchar', { name: 'cmpy_acc15', length: 20, default: '140501' })
    @Expose({ name: 'acc15' })
    @Exclude()
    cmpy_acc15: string;

    @Column('varchar', { name: 'cmpy_acc16', length: 20, default: '147001' })
    @Expose({ name: 'acc16' })
    @Exclude()
    cmpy_acc16: string;

    @Column('varchar', { name: 'cmpy_acc17', length: 20, default: '147002' })
    @Expose({ name: 'acc17' })
    @Exclude()
    cmpy_acc17: string;

    @Column('varchar', { name: 'cmpy_acc18', length: 20, default: '14650505' })
    @Expose({ name: 'acc18' })
    @Exclude()
    cmpy_acc18: string;

    @Column('bigint', { name: 'cmpy_type_currency_id', nullable: true, default: 35 })
    @Expose({ name: 'type_currency_id' })
    @Exclude()
    cmpy_type_currency_id: number;

    @Column('varchar', { name: 'cmpy_type_currency', length: 191, nullable: true, default: "Peso colombiano" })
    @Expose({ name: 'type_currency' })
    @Exclude()
    cmpy_type_currency: string;

    @Column('bigint', { name: 'cmpy_language_id', nullable: true, default: 79 })
    @Expose({ name: 'language_id' })
    @Exclude()
    cmpy_language_id: number;

    @Column('varchar', { name: 'cmpy_language', length: 191, nullable: true, default: 'Spanish; Castilian' })
    @Expose({ name: 'language' })
    @Exclude()
    cmpy_language: string;

    @Column('bigint', { name: 'cmpy_type_operations_id', nullable: true,default:10 })
    @Expose({ name: 'type_operations_id' })
    @Exclude()
    cmpy_type_operations_id: number;

    @Column('varchar', { name: 'cmpy_type_operations', length: 191, nullable: true,default:"Estandar" })
    @Expose({ name: 'type_operations' })
    @Exclude()
    cmpy_type_operations: string;

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

    @Column('varchar', { name: 'cmpy_inv', length: 80,default: "00" })
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