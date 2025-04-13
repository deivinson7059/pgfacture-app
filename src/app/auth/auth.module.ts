import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { Role, RoleScope, Scope, UserCompany, User, Platform, Session } from './entities';
import { UsersController, ScopesController, RolesController, AuthController, SessionController } from './controllers';
import { ScopesService, RolesService, UserService, AuthService, SessionService, PlatformService } from './services';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard, ScopesGuard } from './guards';
import { APP_GUARD } from '@nestjs/core';
import { WebsocketGateway } from './gateways/websocket.gateway';

@Module({
    controllers: [
        AuthController,
        UsersController,
        ScopesController,
        RolesController,
        SessionController
    ],
    providers: [
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
        TypeOrmModule.forFeature([User, UserCompany, Scope, Role, RoleScope, Platform, Session]),
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
    exports: [JwtStrategy, PassportModule, JwtModule, SessionService, WebsocketGateway],
})
export class AuthModule { }