import { IsIn, IsOptional, Matches } from 'class-validator';

export class ListCompanyDto {
  // Usamos un patrón para validar 'ALL' o cualquier número que tenga 1-4 dígitos con ceros a la izquierda si es necesario.
  @Matches(/^ALL$|^\d{1,4}$/, { message: 'cmpy must be ALL or a number between 01 and 1000' })
  @IsOptional()
  cmpy: string;
}
