import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Platform } from '../entities';
import { apiResponse } from '@common/interfaces';

@Injectable()
export class PlatformService implements OnModuleInit {
    constructor(
        @InjectRepository(Platform)
        private readonly platformRepository: Repository<Platform>
    ) { }

    // Este método se ejecutará cuando se inicie el módulo
    async onModuleInit() {
        // Verificar si ya existen las plataformas
        const count = await this.platformRepository.count();

        // Si no hay plataformas, crear las predeterminadas
        if (count === 0) {
            await this.createDefaultPlatforms();
        }
    }

    // Método privado para crear las plataformas predeterminadas
    private async createDefaultPlatforms() {
        const defaultPlatforms = [
            {
                p_id: 1,
                p_name: 'Android',
                p_description: 'Plataforma móvil Android',
                p_enabled: 'Y'
            },
            {
                p_id: 2,
                p_name: 'iOS',
                p_description: 'Plataforma móvil iOS de Apple',
                p_enabled: 'Y'
            },
            {
                p_id: 3,
                p_name: 'Web',
                p_description: 'Plataforma web (navegadores)',
                p_enabled: 'Y'
            }
        ];

        // Guardar las plataformas en la base de datos
        await this.platformRepository.save(defaultPlatforms);
    }

    // Obtener todas las plataformas
    async findAll(): Promise<apiResponse<Platform[]>> {
        const platforms = await this.platformRepository.find({
            where: { p_enabled: 'Y' }
        });

        return {
            message: 'Plataformas obtenidas correctamente',
            data: platforms
        };
    }

    // Obtener una plataforma por ID
    async findById(id: number): Promise<Platform | null> {
        return this.platformRepository.findOne({
            where: { p_id: id, p_enabled: 'Y' }
        });
    }

    // Identificar la plataforma según el User-Agent
    async identifyPlatform(userAgent: string): Promise<number> {
        // Detección simple basada en User-Agent
        const userAgentLower = userAgent.toLowerCase();

        if (userAgentLower.includes('android')) {
            return 1; // Android
        } else if (userAgentLower.includes('iphone') || userAgentLower.includes('ipad') || userAgentLower.includes('ipod')) {
            return 2; // iOS
        } else {
            return 3; // Web (por defecto)
        }
    }
}