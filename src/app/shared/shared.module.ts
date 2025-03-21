import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentController } from './controllers';
import { CommentService } from './services';
import { Comment } from './entities';
import { CheckCompanyGuard, CheckPeriodGuard, CheckSucursalGuard } from '../common/guards';
import { CompanyService } from '../settings/services/company.service';
import { Period } from '../accounting/entities';
import { Company, Sucursal } from '../settings/entities';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Comment,
            Period,
            Sucursal,
            Company
        ])
    ],
    controllers: [
        CommentController
    ],
    providers: [
        CommentService,
        CheckSucursalGuard,
        CheckCompanyGuard,
        CheckPeriodGuard,
        CompanyService,
    ],
    exports: [
        TypeOrmModule
    ]
})
export class SharedModule { }