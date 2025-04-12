import { PartialType } from '@nestjs/mapped-types';
import { CreateCompanyAccountConfigDto } from './create-company-account-config.dto';

export class UpdateCompanyAccountConfigDto extends PartialType(CreateCompanyAccountConfigDto) { }