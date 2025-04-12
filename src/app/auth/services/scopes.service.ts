import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Scope } from '../entities';
import { CreateScopeDto } from '../dto/create-scope.dto';
import { apiResponse } from '@common/interfaces';

@Injectable()
export class ScopesService {
    constructor(
        @InjectRepository(Scope)
        private readonly scopeRepository: Repository<Scope>
    ) { }

    /**
     * Crear un nuevo scope en el sistema
     */
    async createScope(createScopeDto: CreateScopeDto): Promise<apiResponse<Scope>> {
        try {
            // Verificar si el scope ya existe
            const existingScope = await this.scopeRepository.findOne({
                where: { s_id: createScopeDto.id }
            });

            if (existingScope) {
                throw new BadRequestException(`Ya existe un scope con el ID: ${createScopeDto.id}`);
            }

            // Crear el nuevo scope
            const newScope = this.scopeRepository.create({
                s_id: createScopeDto.id,
                s_description: createScopeDto.description,
                s_active: createScopeDto.active || 1
            });

            const savedScope = await this.scopeRepository.save(newScope);

            return {
                message: 'Scope creado exitosamente',
                data: savedScope
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException(`Error al crear el scope: ${error.message}`);
        }
    }

    /**
     * Obtener todos los scopes disponibles
     */
    async findAllScopes(): Promise<apiResponse<Scope[]>> {
        try {
            const scopes = await this.scopeRepository.find({
                where: { s_active: 1 }
            });

            return {
                message: 'Scopes obtenidos exitosamente',
                data: scopes
            };
        } catch (error) {
            throw new BadRequestException(`Error al obtener los scopes: ${error.message}`);
        }
    }
}