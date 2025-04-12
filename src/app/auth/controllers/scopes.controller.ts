import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ScopesService } from '../services/scopes.service';
import { CreateScopeDto } from '../dto/create-scope.dto';
import { JwtAuthGuard, ScopesGuard } from '@auth/guards';
import { Public, RequiredScopes } from '@auth/decorators';

@Controller('auth/scopes')
@UseGuards(JwtAuthGuard, ScopesGuard)
export class ScopesController {
    constructor(private readonly scopesService: ScopesService) { }

    @Public()
    @Post()
    //@RequiredScopes('write:security_access')
    createScope(@Body() createScopeDto: CreateScopeDto) {
        return this.scopesService.createScope(createScopeDto);
    }

    @Public()
    @Get()
    //@RequiredScopes('read:security_access')
    findAllScopes() {
        return this.scopesService.findAllScopes();
    }
}