import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnauthorizedException } from '@nestjs/common/exceptions';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { UserLogin } from '@auth/entities';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        @InjectRepository(UserLogin)
        private readonly userRepository: Repository<UserLogin>,
        configService: ConfigService,
    ) {
        super({
            secretOrKey: configService.get<string>('JWT_SECRET', 'defaultSecret'),
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        });
    }

    async validate(payload: JwtPayload): Promise<any> {
        const { sub } = payload;
        const user = await this.userRepository.findOneBy({ u_id: sub });

        if (!user) {
            throw new UnauthorizedException(`Token inválido`);
        }

        if (user.u_active !== 1) {
            throw new UnauthorizedException(`Usuario inactivo`);
        }

        if (user.u_locked === 1) {
            throw new UnauthorizedException(`Usuario bloqueado`);
        }

        // Agregamos los scopes y otra información del payload al request
        return {
            id: sub,
            identification_number: payload.ident,
            company: payload.company,
            branch: payload.branch,
            role_id: payload.role_id,
            role_name: payload.role_name,
            scopes: payload.scopes
        };
    }
}