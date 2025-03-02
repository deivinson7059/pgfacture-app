import { IsString, IsOptional, IsNumber, IsDateString, IsIn } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  cmpy: string;

  @IsNumber()
  type_document_identification_id: number;

  @IsString()
  type_document_identification: string;

  @IsString()
  document_identification: string;

  @IsString()
  dv: string;

  @IsString()
  business_name: string;

  @IsString()
  trading_name: string;

  @IsString()
  @IsOptional()
  @IsIn(['none', 'cmpy', 'ware']) // Valores permitidos
  trading_type: string;

  @IsString()
  rep_id: string;

  @IsString()
  @IsOptional()
  actividad: string;

  @IsString()
  @IsOptional()
  actividad_sec: string;

  @IsNumber()
  type_organization_id: number;

  @IsString()
  organization: string;

  @IsNumber()
  type_regime_id: number;

  @IsString()
  regime: string;

  @IsNumber()
  type_liability_id: number;

  @IsString()
  liability: string;

  @IsString()
  @IsOptional()
  merchant_registration: string;

  @IsNumber()
  dep_id: number;

  @IsString()
  dep: string;

  @IsNumber()
  municipality_id: number;

  @IsString()
  municipality: string;

  @IsString()
  dir: string;

  @IsString()
  tel: string;

  @IsString()
  @IsOptional()
  postal_zone_code: string;

  @IsNumber()
  @IsOptional()
  country_id: number;

  @IsString()
  @IsOptional()
  country: string;

  @IsString()
  email: string;

  @IsString()
  @IsOptional()
  @IsIn(['Y', 'N'])
  restobar: string;

  @IsString()
  letter: string;

  @IsNumber()
  @IsOptional()
  next: number;

  @IsNumber()
  @IsOptional()
  @IsIn([1, 2])
  print_id: number;

  @IsString()
  @IsIn(['Y', 'N'])
  @IsOptional()
  enabled: string;

  @IsString()
  @IsOptional()
  api_dian: string;

  @IsString()
  @IsOptional()
  api_token?: string;

  @IsOptional()
  @IsNumber()
  api_id?: number;

  @IsString()
  @IsOptional()
  invoice_template: string;

  @IsString()
  @IsOptional()
  pos_template: string;

  @IsString()
  @IsOptional()
  template_token: string;

  @IsString()
  @IsIn(['Y', 'N'])
  @IsOptional()
  fe_enabled: string;

  @IsString()
  @IsIn(['Y', 'N'])
  @IsOptional()
  ne_enabled: string;

  @IsString()
  @IsOptional()
  @IsIn(['Mensual', 'Qincenal'])
  ne_liqu: string;

  @IsString()
  @IsIn(['Y', 'N'])
  @IsOptional()
  fe_send_aut: string;

  @IsString()
  @IsOptional()
  acc1: string;

  @IsString()
  @IsOptional()
  acc2: string;

  @IsString()
  @IsOptional()
  acc3: string;

  @IsString()
  @IsOptional()
  acc4: string;

  @IsString()
  @IsOptional()
  acc5: string;

  @IsString()
  @IsOptional()
  acc6: string;

  @IsString()
  @IsOptional()
  acc7: string;

  @IsString()
  @IsOptional()
  acc8: string;

  @IsString()
  @IsOptional()
  acc9: string;

  @IsString()
  @IsOptional()
  acc10: string;

  @IsString()
  @IsOptional()
  acc11: string;

  @IsString()
  @IsOptional()
  acc12: string;

  @IsString()
  @IsOptional()
  acc13: string;

  @IsString()
  @IsOptional()
  acc14: string;

  @IsString()
  @IsOptional()
  acc15: string;

  @IsString()
  @IsOptional()
  acc16: string;

  @IsString()
  @IsOptional()
  acc17: string;

  @IsString()
  @IsOptional()
  acc18: string;

  @IsOptional()
  @IsNumber()
  type_currency_id?: number;

  @IsOptional()
  @IsString()
  type_currency?: string;

  @IsOptional()
  @IsNumber()
  language_id?: number;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsNumber()
  type_operations_id?: number;

  @IsOptional()
  @IsString()
  type_operations?: string;

  @IsString()
  @IsOptional()
  @IsIn(['SI', 'NO'])
  show_users: string;

  @IsString()
  @IsOptional()
  @IsIn(['SI', 'NO'])
  rount_prices: string;

  @IsString()
  @IsOptional()
  @IsIn(['SI', 'NO'])
  over_tops: string;

  @IsString()
  @IsOptional()
  @IsIn(['SI', 'NO'])
  online_store: string;

  @IsNumber()
  @IsOptional()
  account: number;

  @IsString()
  @IsOptional()
  tax: string;

  @IsNumber()
  @IsOptional()
  uvt: number;

  @IsString()
  @IsOptional()
  inv: string;

  @IsNumber()
  @IsOptional()
  pln_id: number;

  @IsString()
  @IsOptional()
  @IsIn(['Y', 'N'])
  pay_ret: string;

  @IsString()
  @IsOptional()
  @IsIn(['Y', 'N'])
  pay_ref: string;

  @IsString()
  @IsOptional()
  @IsIn(['Y', 'N'])
  ter_edit: string;

  @IsOptional()
  @IsDateString()
  pln_start_date?: Date;

  @IsOptional()
  @IsDateString()
  pln_end_date?: Date;

  @IsString()
  @IsIn(['ANUAL', 'MENSUAL'])
  @IsOptional()
  pay: string;
}