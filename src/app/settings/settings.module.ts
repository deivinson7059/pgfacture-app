import { Module } from '@nestjs/common';
import { CompanyController } from './controllers/company.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SucursalController } from './controllers/sucursal.controller';
import { CompanyService } from './services/company.service';
import { Company, Customer } from './entities';
import { SucursalService } from './services/sucursal.service';
import { Sucursal } from './entities/sucursal.entity';
import { CustomerController } from './controllers';
import { CustomerService } from './services';

@Module({
    controllers: [
        CompanyController,
        SucursalController,
        CustomerController
    ],
    providers: [
        CompanyService,
        SucursalService,
        CustomerService
    ],
    imports: [
        TypeOrmModule.forFeature(
            [
                Company,
                Sucursal,
                Customer
            ]
        )
    ],
    exports: [
        TypeOrmModule
    ],
})
export class SettingsModule { }
