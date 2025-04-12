import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { Role, RoleScope, Scope, UserCompany, UserLogin } from './entities';
import { AuthController, ScopesController, RolesController } from './controllers';
import { ScopesService, RolesService } from './services';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard, ScopesGuard } from './guards';
import { APP_GUARD } from '@nestjs/core';

@Module({
    controllers: [AuthController, ScopesController, RolesController],
    providers: [
        AuthService,
        ScopesService,
        RolesService,
        JwtStrategy,
        {
            provide: APP_GUARD,
            useClass: JwtAuthGuard,
        },
        {
            provide: APP_GUARD,
            useClass: ScopesGuard,
        }
    ],
    imports: [
        TypeOrmModule.forFeature([UserLogin, UserCompany, Scope, Role, RoleScope]),
        ConfigModule,
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get('JWT_SECRET'),
                signOptions: { expiresIn: '2 days' },
            }),
        }),
    ],
    exports: [JwtStrategy, PassportModule, JwtModule],
})
export class AuthModule { }