// src/branch/entities/branch.entity.ts
import { Entity, Column, PrimaryColumn, Index } from 'typeorm';
import { Expose } from 'class-transformer';

@Entity({ schema: 'pgfacture', name: 'pg_sucursal' })
@Index('pg_sucursal_fk3', ['suc_cmpy', 'suc_nombre'])
export class Sucursal {
    @PrimaryColumn('varchar', { name: 'suc_cmpy', length: 10 })
    @Index('pg_sucursal_fk1')
    @Expose({ name: 'cmpy' })
    suc_cmpy: string;

    @PrimaryColumn('int', { name: 'suc_id' })
    @Index('pg_sucursal_fk4')
    @Expose({ name: 'id' })
    suc_id: number;

    @Column('varchar', { name: 'suc_nombre', length: 200 })
    @Index('pg_sucursal_fk2')
    @Expose({ name: 'name' })
    suc_nombre: string;

    @Column('varchar', { name: 'suc_direccion', length: 300 })
    @Index('pg_sucursal_fk5')
    @Expose({ name: 'address' })
    suc_direccion: string;

    @Column('varchar', { name: 'suc_email', length: 150 })
    @Index('pg_sucursal_fk6')
    @Expose({ name: 'email' })
    suc_email: string;

    @Column('varchar', { name: 'suc_departamento', length: 250 })
    @Index('pg_sucursal_fk7')
    @Expose({ name: 'department' })
    suc_departamento: string;

    @Column('varchar', { name: 'suc_ciudad', length: 250 })
    @Index('pg_sucursal_fk8')
    @Expose({ name: 'city' })
    suc_ciudad: string;

    @Column('bigint', { name: 'suc_ciudad_id', nullable: true })
    @Index('pg_sucursal_fk9')
    @Expose({ name: 'city_id' })
    suc_ciudad_id: number;

    @Column('varchar', { name: 'suc_telefono', length: 60 })
    @Index('pg_sucursal_fk10')
    @Expose({ name: 'phone' })
    suc_telefono: string;

    @Column('varchar', { name: 'suc_celular', length: 60 })
    @Index('pg_sucursal_fk11')
    @Expose({ name: 'mobile' })
    suc_celular: string;

    @Column('varchar', { name: 'suc_razon_dif', length: 10, default: 'NO' })
    @Expose({ name: 'different_reason' })
    suc_razon_dif: string;

    @Column('varchar', { name: 'suc_razon', length: 300 })
    @Expose({ name: 'reason' })
    suc_razon: string;

    @Column('varchar', { name: 'suc_nit', length: 80 })
    @Expose({ name: 'tax_id' })
    suc_nit: string;

    @Column('varchar', { name: 'suc_fact_cero', length: 10, default: 'NO' })
    @Expose({ name: 'zero_invoice' })
    suc_fact_cero: string;

    @Column('varchar', { name: 'suc_sw_code', length: 5, default: 'OFF' })
    @Expose({ name: 'sw_code' })
    suc_sw_code: string;

    @Column('varchar', { name: 'suc_sw', length: 5, default: 'OFF' })
    @Expose({ name: 'sw' })
    suc_sw: string;

    @Column('varchar', { name: 'suc_iva_incl', length: 10, default: 'NO' })
    @Expose({ name: 'include_vat' })
    suc_iva_incl: string;

    @Column('varchar', { name: 'suc_usu_mostra', length: 10, default: 'SI' })
    @Expose({ name: 'show_users' })
    suc_usu_mostra: string;

    @Column('varchar', { name: 'suc_fact_elect', length: 10, default: 'NO' })
    @Expose({ name: 'electronic_invoice' })
    suc_fact_elect: string;

    @Column('varchar', { name: 'suc_activa', length: 10, default: 'SI' })
    @Expose({ name: 'active' })
    suc_activa: string;

    @Column('decimal', { name: 'suc_reteica', precision: 30, scale: 2, default: 0.00 })
    @Expose({ name: 'reteica' })
    suc_reteica: number;

    @Column('text', { name: 'suc_logo' })
    @Expose({ name: 'logo' })
    suc_logo: string;

    @Column('text', { name: 'suc_term', nullable: true })
    @Expose({ name: 'terms' })
    suc_term: string;

    @Column('varchar', { name: 'suc_lista', length: 10, default: 'P1' })
    @Expose({ name: 'list' })
    suc_lista: string;
}
