import { Module } from '@nestjs/common';
import { CompanyController } from './controllers/company.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SucursalController } from './controllers/sucursal.controller';
import { CompanyService } from './services/company.service';
import { Company, CompanyAccountConfig, Customer } from './entities';
import { SucursalService } from './services/sucursal.service';
import { Sucursal } from './entities/sucursal.entity';
import { CompanyAccountConfigController, CustomerController } from './controllers';
import { CompanyAccountConfigService, CustomerService, PasswordCryptoService } from './services';

@Module({
    controllers: [
        CompanyController,
        CompanyAccountConfigController,
        SucursalController,
        CustomerController
    ],
    providers: [
        CompanyService,
        CompanyAccountConfigService,
        SucursalService,
        CustomerService,
        PasswordCryptoService
    ],
    imports: [
        TypeOrmModule.forFeature(
            [
                Company,
                CompanyAccountConfig,
                Sucursal,
                Customer,
            ]
        )
    ],
    exports: [
        TypeOrmModule,
        CompanyService,
        CompanyAccountConfigService
    ],
})
export class SettingsModule { }
