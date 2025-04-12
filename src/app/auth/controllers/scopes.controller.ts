import { Controller, Get, Post, Body, UseGuards, UseInterceptors, ClassSerializerInterceptor, HttpCode, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { ScopesService } from '../services/scopes.service';
import { CreateScopeDto } from '../dto/create-scope.dto';
import { JwtAuthGuard, ScopesGuard } from '@auth/guards';
import { Public, RequiredScopes } from '@auth/decorators';
import { ApplyDecorators } from '@common/decorators';

@Controller('auth/scopes')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard, ScopesGuard)
export class ScopesController {
    constructor(private readonly scopesService: ScopesService) { }

    @Public()
    @Post()
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    //@RequiredScopes('write:security_access')
    createScope(@Body() createScopeDto: CreateScopeDto) {
        return this.scopesService.createScope(createScopeDto);
    }

    @Public()
    @Get()
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    //@RequiredScopes('read:security_access')
    findAllScopes() {
        return this.scopesService.findAllScopes();
    }
}