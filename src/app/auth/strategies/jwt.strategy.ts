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

    async validate(payload: JwtPayload): Promise<UserLogin> {
        const { id } = payload;
        const user = await this.userRepository.findOneBy({ u_id: id });

        if (!user) {
            throw new UnauthorizedException(`Invalid token`);
        }

        return user;
    }
}