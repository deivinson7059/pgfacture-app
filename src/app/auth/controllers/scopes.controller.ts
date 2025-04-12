import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ScopesService } from '../services/scopes.service';
import { CreateScopeDto } from '../dto/create-scope.dto';
import { CreateCompanyRoleDto } from '../dto/create-company-role.dto';
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
        console.log('createScopeDto', createScopeDto);
        return this.scopesService.createScope(createScopeDto);
    }

    @Public()
    @Get()
    //@RequiredScopes('read:security_access')
    findAllScopes() {
        return this.scopesService.findAllScopes();
    }

    @Post('roles')
    //@RequiredScopes('write:security_access')
    createCompanyRole(@Body() createRoleDto: CreateCompanyRoleDto) {
        return this.scopesService.createCompanyRole(createRoleDto);
    }

    @Get('roles/:companyId')
    //@RequiredScopes('read:security_access')
    getCompanyRoles(@Param('companyId') companyId: string) {
        return this.scopesService.getCompanyRoles(companyId);
    }

    @Get('roles/:companyId/:roleId')
    //@RequiredScopes('read:security_access')
    getRoleScopes(
        @Param('roleId') roleId: string,
        @Param('companyId') companyId: string
    ) {
        return this.scopesService.getRoleScopes(roleId, companyId);
    }
}