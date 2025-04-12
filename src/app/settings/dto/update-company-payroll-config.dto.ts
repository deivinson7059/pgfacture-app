import { PartialType } from '@nestjs/mapped-types';
import { CreateCompanyPayrollConfigDto } from './create-company-payroll-config.dto';

export class UpdateCompanyPayrollConfigDto extends PartialType(CreateCompanyPayrollConfigDto) { }
