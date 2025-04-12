import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Comment } from '@shared/entities';
import { Period } from '@accounting/entities';
import { Company, CompanyAccountConfig, Sucursal } from '@settings/entities';

import { CommentController } from '@shared/controllers';

import { CommentService } from '@shared/services';
import { CompanyService } from '@settings/services';

import { CheckCompanyGuard, CheckPeriodGuard, CheckSucursalGuard } from '@common/guards';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Comment,
            Period,
            Sucursal,
            Company,
            CompanyAccountConfig
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
        CommentService,
        TypeOrmModule
    ]
})
export class SharedModule { }