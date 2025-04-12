import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { Role, RoleScope, Scope, UserCompany, User } from './entities';
import { UsersController, ScopesController, RolesController, AuthController } from './controllers';
import { ScopesService, RolesService, UserService, AuthService } from './services';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard, ScopesGuard } from './guards';
import { APP_GUARD } from '@nestjs/core';

@Module({
    controllers: [AuthController, UsersController, ScopesController, RolesController],
    providers: [
        AuthService,
        UserService,
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
        TypeOrmModule.forFeature([User, UserCompany, Scope, Role, RoleScope]),
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