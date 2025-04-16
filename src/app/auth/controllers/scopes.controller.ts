import { Controller, Get, Post, Body, UseGuards, UseInterceptors, ClassSerializerInterceptor, HttpCode, HttpStatus, UsePipes, ValidationPipe, Delete, Param } from '@nestjs/common';
import { ScopesService } from '../services/scopes.service';
import { CreateScopeDto } from '../dto/create-scope.dto';
import { JwtAuthGuard, ScopesGuard } from '@auth/guards';
import { RequiredScopes } from '@auth/decorators';
import { ApplyDecorators } from '@common/decorators';

@Controller('auth/scopes')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard, ScopesGuard)
export class ScopesController {
    constructor(private readonly scopesService: ScopesService) { }

    @Post()
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    @RequiredScopes('write:scopes')
    createScope(@Body() createScopeDto: CreateScopeDto) {
        return this.scopesService.createScope(createScopeDto);
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    @RequiredScopes('read:scopes')
    findAllScopes() {
        return this.scopesService.findAllScopes();
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    @RequiredScopes('write:scopes')
    deleteScope(@Param('id') id: string) {
        return this.scopesService.deleteScope(id);
    }
}