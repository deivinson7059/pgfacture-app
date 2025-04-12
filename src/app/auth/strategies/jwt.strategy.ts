import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnauthorizedException } from '@nestjs/common/exceptions';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { User, UserCompany, Role } from '@auth/entities';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(UserCompany)
        private readonly userCompanyRepository: Repository<UserCompany>,
        @InjectRepository(Role)
        private readonly roleRepository: Repository<Role>,
        configService: ConfigService,
    ) {
        super({
            secretOrKey: configService.get<string>('JWT_SECRET', 'defaultSecret'),
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        });
    }

    async validate(payload: JwtPayload): Promise<any> {
        const { sub, ident, company, branch } = payload;

        // Verificar que el usuario existe
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

        // Obtener la relación usuario-compañía
        const userCompany = await this.userCompanyRepository.findOne({
            where: {
                uc_person_identification_number: ident,
                uc_cmpy: company,
                uc_ware: branch
            }
        });

        if (!userCompany) {
            throw new UnauthorizedException(`No tiene acceso a esta compañía o sucursal`);
        }

        // Obtener el rol del usuario
        const role = await this.roleRepository.findOne({
            where: { rol_id: userCompany.uc_role_id }
        });

        if (!role) {
            throw new UnauthorizedException(`Rol no encontrado`);
        }

        // Aquí deberíamos obtener los scopes del rol, pero como estamos en el proceso de rediseño
        // se implementará posteriormente

        return {
            id: sub,
            identification_number: ident,
            company: company,
            branch: branch,
            role_id: userCompany.uc_role_id,
            role_name: role.rol_name,
            role_path: role.rol_path,
            scopes: payload.scopes // Temporalmente mantenemos los scopes del payload
        };
    }
}