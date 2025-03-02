import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { Expose } from 'class-transformer';
import { dateTransformer } from 'src/app/common/utils/fechaColombia';
import { NoteHeader } from '.';

@Entity({ schema: 'pgfacture', name: 'pg_accounting_note_line' })
@Index('idx_accounting_note_line_header', ['acnl_header_id'])
@Index('idx_accounting_note_line_account', ['acnl_account'])
//notas contables lineas
export class NoteLine {
  @PrimaryGeneratedColumn('uuid', { name: 'acnl_id' })
  @Expose({ name: 'id' })
  acnl_id: string;

  @Column({ name: 'acnl_header_id', type: 'uuid' })
  @Expose({ name: 'header_id' })
  acnl_header_id: string;

  @Column({ name: 'acnl_line_number', type: 'int' })
  @Expose({ name: 'line_number' })
  acnl_line_number: number;

  @Column({ name: 'acnl_account', type: 'varchar', length: 20 })
  @Expose({ name: 'account' })
  acnl_account: string;

  @Column({ name: 'acnl_account_name', type: 'varchar', length: 500 })
  @Expose({ name: 'account_name' })
  acnl_account_name: string;

  @Column({ name: 'acnl_description', type: 'varchar', length: 500, nullable: true })
  @Expose({ name: 'description' })
  acnl_description: string;

  @Column({ name: 'acnl_debit', type: 'decimal', precision: 15, scale: 2, default: 0 })
  @Expose({ name: 'debit' })
  acnl_debit: number;

  @Column({ name: 'acnl_credit', type: 'decimal', precision: 15, scale: 2, default: 0 })
  @Expose({ name: 'credit' })
  acnl_credit: number;

  @Column({ name: 'acnl_reference', type: 'varchar', length: 100, nullable: true })
  @Expose({ name: 'reference' })
  acnl_reference: string;

  @Column({ name: 'acnl_creation_by', type: 'varchar', length: 30 })
  @Expose({ name: 'creation_by' })
  acnl_creation_by: string;

  @CreateDateColumn({
    name: 'acnl_creation_date',
    type: 'timestamp',
    precision: 6,
    transformer: dateTransformer(),
  })
  @Expose({ name: 'creation_date' })
  acnl_creation_date: Date;

  @ManyToOne(() => NoteHeader, header => header.lines)
  @JoinColumn({ name: 'acnl_header_id' })
  header: NoteHeader;
}