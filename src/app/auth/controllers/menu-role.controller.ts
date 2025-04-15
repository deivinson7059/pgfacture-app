import { Controller, Get, Post, Body, Param, Delete, Put, UseInterceptors, ClassSerializerInterceptor, HttpCode, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';

import { MenuRoleService } from '@auth/services/menu-role.service';
import { CreateMenuRoleDto, UpdateMenuRoleDto } from '@auth/dto';
import { MenuRole } from '@auth/entities';
import { apiResponse } from '@common/interfaces';
import { ApplyDecorators, CheckCmpy } from '@common/decorators';
import { ParamSource } from '@common/enums';
import { Public } from '@auth/decorators';

@Controller('menu-roles')
@UseInterceptors(ClassSerializerInterceptor)
export class MenuRoleController {
    constructor(private readonly menuRoleService: MenuRoleService) { }

    @Public()
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApplyDecorators([
        CheckCmpy(ParamSource.BODY),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async create(@Body() createMenuRoleDto: CreateMenuRoleDto): Promise<apiResponse<MenuRole>> {
        return this.menuRoleService.create(createMenuRoleDto);
    }

    @Public()
    @Get()
    @HttpCode(HttpStatus.OK)
    async findAll(): Promise<apiResponse<MenuRole[]>> {
        return this.menuRoleService.findAll();
    }

    @Public()
    @Get('by-company/:cmpy')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.PARAMS)
    ])
    async findByCompany(@Param('cmpy') cmpy: string): Promise<apiResponse<MenuRole[]>> {
        return this.menuRoleService.findByCompany(cmpy);
    }

    @Public()
    @Get(':cmpy/:roleId')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.PARAMS)
    ])
    async findByRole(
        @Param('cmpy') cmpy: string,
        @Param('roleId') roleId: string
    ): Promise<apiResponse<MenuRole[]>> {
        return this.menuRoleService.findByRole(cmpy, roleId);
    }

    @Public()
    @Get('structure/:cmpy/:roleId')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.PARAMS)
    ])
    async getMenuStructureForRole(
        @Param('cmpy') cmpy: string,
        @Param('roleId') roleId: string
    ): Promise<apiResponse<any>> {
        return this.menuRoleService.getMenuStructureForRole(cmpy, roleId);
    }

    @Public()
    @Get('detail/:id')
    @HttpCode(HttpStatus.OK)
    async findOne(@Param('id') id: string): Promise<apiResponse<MenuRole>> {
        return this.menuRoleService.findOne(+id);
    }

    @Public()
    @Put(':id')
    @HttpCode(HttpStatus.OK)
    @UsePipes(new ValidationPipe({ transform: true }))
    async update(
        @Param('id') id: string,
        @Body() updateMenuRoleDto: UpdateMenuRoleDto
    ): Promise<apiResponse<MenuRole>> {
        return this.menuRoleService.update(+id, updateMenuRoleDto);
    }

    @Public()
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async remove(@Param('id') id: string): Promise<apiResponse<void>> {
        return this.menuRoleService.remove(+id);
    }

    @Public()
    @Delete(':cmpy/:roleId/:menuId/:menuOptionId')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.PARAMS)
    ])
    async removeByRoleAndMenu(
        @Param('cmpy') cmpy: string,
        @Param('roleId') roleId: string,
        @Param('menuId') menuId: string,
        @Param('menuOptionId') menuOptionId: string
    ): Promise<apiResponse<void>> {
        return this.menuRoleService.removeByRoleAndMenu(cmpy, roleId, +menuId, +menuOptionId);
    }
}