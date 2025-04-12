import { Module } from '@nestjs/common';
import { CompanyController } from './controllers/company.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SucursalController } from './controllers/sucursal.controller';
import { CompanyService } from './services/company.service';
import { Company, CompanyAccountConfig, CompanyPayrollConfig, Customer } from './entities';
import { SucursalService } from './services/sucursal.service';
import { Sucursal } from './entities/sucursal.entity';
import { CompanyAccountConfigController, CompanyPayrollConfigController, CustomerController } from './controllers';
import { CompanyAccountConfigService, CompanyPayrollConfigService, CustomerService, PasswordCryptoService } from './services';

@Module({
    controllers: [
        CompanyController,
        CompanyAccountConfigController,
        CompanyPayrollConfigController,
        SucursalController,
        CustomerController
    ],
    providers: [
        CompanyService,
        CompanyAccountConfigService,
        CompanyPayrollConfigService,
        SucursalService,
        CustomerService,
        PasswordCryptoService
    ],
    imports: [
        TypeOrmModule.forFeature(
            [
                Company,
                CompanyAccountConfig,
                CompanyPayrollConfig,
                Sucursal,
                Customer,
            ]
        )
    ],
    exports: [
        TypeOrmModule,
    ],
})
export class SettingsModule { }
