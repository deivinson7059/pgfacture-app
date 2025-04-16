import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { Role, RoleScope, Scope, UserCompany, User, Platform, Session, Menu, MenuOption, MenuRole } from './entities';
import { UsersController, ScopesController, RolesController, AuthController, SessionController, MenuController, MenuOptionController, MenuRoleController } from './controllers';
import { ScopesService, RolesService, UserService, AuthService, SessionService, PlatformService, MenuService, MenuOptionService, MenuRoleService, MenuInitializerService, ScopesInitializerService } from './services';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard, ScopesGuard } from './guards';
import { APP_GUARD } from '@nestjs/core';
import { WebsocketGateway } from './gateways/websocket.gateway';
import { Company, Sucursal } from '@settings/entities';

@Module({
    controllers: [
        MenuController,
        MenuOptionController,
        MenuRoleController,
        AuthController,

        UsersController,
        ScopesController,
        RolesController,
        SessionController,
    ],
    providers: [
        MenuService,
        MenuOptionService,
        MenuRoleService,
        MenuInitializerService,
        ScopesInitializerService,
        AuthService,
        UserService,
        ScopesService,
        RolesService,
        SessionService,
        PlatformService,
        JwtStrategy,
        WebsocketGateway,
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
        TypeOrmModule.forFeature([
            Company,
            Sucursal,
            Menu,
            MenuOption,
            MenuRole,
            Role,
            User,
            UserCompany,
            Scope,
            Role,
            RoleScope,
            Platform,
            Session,
        ]),
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
    exports: [
        MenuService,
        MenuOptionService,
        MenuRoleService,
        JwtStrategy,
        PassportModule,
        JwtModule,
        SessionService,
        WebsocketGateway,
    ],
})
export class AuthModule { }