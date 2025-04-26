import { Controller, Get, Post, Body, Param, UseGuards, Delete, Put } from '@nestjs/common';
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

    @Public()
    @Put(':roleId')
    //@RequiredScopes('write:roles')
    updateRole(
        @Param('roleId') roleId: string,
        @Body() updateData: { description?: string; path?: string }
    ) {
        return this.rolesService.updateRole(roleId, updateData);
    }

    @Public()
    @Get(':roleName/scopes')
    //@RequiredScopes('read:roles')
    getRoleScopes(@Param('roleName') roleName: string) {
        return this.rolesService.getRoleScopesByName(roleName);
    }

    @Public()
    @Post(':roleName/scopes')
    //@RequiredScopes('write:roles')
    assignScopeToRole(
        @Param('roleName') roleName: string,
        @Body() assignRoleScopeDto: AssignRoleScopeDto
    ) {
        return this.rolesService.assignScopeToRoleByName(roleName, assignRoleScopeDto);
    }

    @Public()
    @Delete(':roleName/scopes/:scopeId')
    //@RequiredScopes('write:roles')
    removeScopeFromRole(
        @Param('roleName') roleName: string,
        @Param('scopeId') scopeId: string
    ) {
        return this.rolesService.removeScopeFromRole(roleName, scopeId);
    }

    @Public()
    @Delete(':roleId')
    //@RequiredScopes('write:roles')
    deleteRole(@Param('roleId') roleId: string) {
        return this.rolesService.deleteRole(roleId);
    }
}