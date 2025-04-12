import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { RolesService } from '../services/roles.service';
import { JwtAuthGuard, ScopesGuard } from '@auth/guards';
import { Public, RequiredScopes } from '@auth/decorators';
import { AssignRoleScopeDto, CreateRoleDto } from '@auth/dto';

@Controller('auth/roles')
@UseGuards(JwtAuthGuard, ScopesGuard)
export class RolesController {
    constructor(private readonly rolesService: RolesService) { }

    @Public()
    @Get()
    findAllRoles() {
        return this.rolesService.findAllRoles();
    }

    @Public()
    @Post()
    //@RequiredScopes('write:roles')
    createRole(@Body() createRoleDto: CreateRoleDto) {
        return this.rolesService.createRole(createRoleDto);
    }

    @Get(':roleId/scopes')
    //@RequiredScopes('read:roles')
    getRoleScopes(@Param('roleId') roleId: number) {
        return this.rolesService.getRoleScopes(roleId);
    }

    @Post(':roleId/scopes')
    //@RequiredScopes('write:roles')
    assignScopeToRole(
        @Param('roleId') roleId: number,
        @Body() assignRoleScopeDto: AssignRoleScopeDto
    ) {
        return this.rolesService.assignScopeToRole(roleId, assignRoleScopeDto);
    }
}