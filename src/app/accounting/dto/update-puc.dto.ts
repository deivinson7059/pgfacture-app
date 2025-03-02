import { Transform } from 'class-transformer';
import { IsString, IsIn, Length, Matches, IsOptional } from 'class-validator';

export class UpdatePucDto {
  @IsString()
  @Length(1, 10) // Máximo 10 dígitos
  @Matches(/^\d+$/, { message: 'El código de la cuenta debe contener solo números.' })
  code: string; // Código de la cuenta

  @IsString()
  @Length(2, 10) // Asegura que el campo tenga entre 2 y 10 caracteres
  //@IsIn(['ALL', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10']) // Valores permitidos
  @Matches(/^ALL$|^\d{1,4}$/, { message: 'cmpy must be ALL or a number between 01 and 1000' })
  cmpy: string; // Código de la empresa

  @IsString()
  @Length(1, 500)
  @Transform(({ value }) => value.charAt(0).toUpperCase() + value.slice(1).toLowerCase())
  description: string; // Descripción de la cuenta

  @IsString()
  @Length(1, 1) // Solo un carácter
  @IsIn(['Y', 'N']) // Valores permitidos: Y o N
  @IsOptional() // Opcional para actualización
  active?: string; // Estado de la cuenta (Y: Activo, N: Inactivo)

  @IsString()
  @Length(1, 30)
  updated_by: string; // Usuario que actualizó la cuenta
}