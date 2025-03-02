import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { hashPassword } from 'src/app/common/utils/passwordHasher';
import { LoginUserDto } from './dto/login-user.dto';
import { verifyPassword } from 'src/app/common/utils/verifyPassword';
import { fechaLocal } from 'src/app/common/utils/fechaColombia';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) { }

  async register({ email, fullName, password, phone }: CreateUserDto) {
    // Busca si ya existe un usuario con el mismo correo electrónico
    const foundUser = await this.userRepository.findOne({ where: { email } });

    // Si se encuentra un usuario con el mismo correo electrónico, se lanza una excepción
    if (foundUser) {
      throw new BadRequestException('User already exist');
    }

    // Genera el hash de la contraseña proporcionada
    const hashedPassword = await hashPassword(password);

    // Crea un nuevo objeto de usuario con los datos proporcionados
    const newUser = this.userRepository.create({
      fullName,
      email,
      phone,
      password: hashedPassword,
    });

    // Guarda el nuevo usuario en la base de datos
    await this.userRepository.save(newUser);

    // Elimina la contraseña del objeto de usuario antes de devolverlo
    delete newUser.password;

    // Devuelve el nuevo usuario junto con un token de acceso generado a partir de su ID
    return {
      ...newUser,
      access_token: this.signJWT(newUser.id),
    };
  }

  private signJWT(id: string) {
    return this.jwtService.sign({ id });
  }

  async login({ email, password }: LoginUserDto) {
    // Busca un usuario en la base de datos usando el correo electrónico proporcionado
    const user = await this.userRepository.findOne({ where: { email } });

    // Si no se encuentra un usuario con el correo electrónico proporcionado, se lanza una excepción
    if (!user) {
      console.log('EMAIL');
      throw new UnauthorizedException('Incorrect email or password');
    }


    // Verifica si la contraseña proporcionada coincide con la contraseña almacenada del usuario
    const passwordsMatch: boolean = verifyPassword({
      hashedPassword: user.password!,
      password,
    });

    // Si las contraseñas no coinciden, se lanza una excepción
    if (!passwordsMatch) {
      console.log('PASSWORD');
      throw new UnauthorizedException('Incorrect email or password');
    }

    console.log('USER', user);

    // Si el usuario no tiene habilitada la autenticación de dos factores
    if (!user.twoFA) {
      // Devuelve el usuario con un indicador de autenticación de dos factores deshabilitado y un token de acceso generado a partir de su ID
      return {
        ...user,
       // createdAt: fechaLocal(user.createdAt),
      //  updatedAt: fechaLocal(user.updatedAt),
        twoFA: false,
        access_token: this.signJWT(user.id),
      };
    } else {
      // Si el usuario tiene habilitada la autenticación de dos factores, se devuelve el usuario con un indicador de autenticación de dos factores habilitado
      return {
        ...user,
        twoFA: true,
      };
    }
  }
}

