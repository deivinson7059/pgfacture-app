import { PartialType } from '@nestjs/mapped-types';
import { CreateSucursalDto } from '.';

export class UpdateSucursalDto extends PartialType(CreateSucursalDto) {}