import { Controller, Get, Post, Body, Param, Delete, Put, UseInterceptors, ClassSerializerInterceptor, HttpCode, HttpStatus, UsePipes, ValidationPipe, Query } from '@nestjs/common';

import { MenuOptionService } from '@auth/services/menu-option.service';
import { CreateMenuOptionDto, UpdateMenuOptionDto } from '@auth/dto';
import { MenuOption } from '@auth/entities';
import { apiResponse } from '@common/interfaces';
import { Public } from '@auth/decorators';

@Controller('menu-options')
@UseInterceptors(ClassSerializerInterceptor)
export class MenuOptionController {
    constructor(private readonly menuOptionService: MenuOptionService) { }

    @Public()
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @UsePipes(new ValidationPipe({ transform: true }))
    async create(@Body() createMenuOptionDto: CreateMenuOptionDto): Promise<apiResponse<MenuOption>> {
        return this.menuOptionService.create(createMenuOptionDto);
    }

    @Public()
    @Get()
    @HttpCode(HttpStatus.OK)
    async findAll(): Promise<apiResponse<MenuOption[]>> {
        return this.menuOptionService.findAll();
    }

    @Public()
    @Get('by-menu/:menuId')
    @HttpCode(HttpStatus.OK)
    async findByMenuId(@Param('menuId') menuId: string): Promise<apiResponse<MenuOption[]>> {
        return this.menuOptionService.findByMenuId(+menuId);
    }

    @Public()
    @Get('by-parent/:parentId')
    @HttpCode(HttpStatus.OK)
    async findByParentId(@Param('parentId') parentId: string): Promise<apiResponse<MenuOption[]>> {
        return this.menuOptionService.findByParentId(+parentId);
    }

    @Public()
    @Get('structure')
    @HttpCode(HttpStatus.OK)
    async getMenuStructure(@Query('menuId') menuId?: string): Promise<apiResponse<any>> {
        return this.menuOptionService.getMenuStructure(menuId ? +menuId : undefined);
    }

    @Public()
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async findOne(@Param('id') id: string): Promise<apiResponse<MenuOption>> {
        return this.menuOptionService.findOne(+id);
    }

    @Public()
    @Put(':id')
    @HttpCode(HttpStatus.OK)
    @UsePipes(new ValidationPipe({ transform: true }))
    async update(
        @Param('id') id: string,
        @Body() updateMenuOptionDto: UpdateMenuOptionDto
    ): Promise<apiResponse<MenuOption>> {
        return this.menuOptionService.update(+id, updateMenuOptionDto);
    }

    @Public()
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async remove(@Param('id') id: string): Promise<apiResponse<void>> {
        return this.menuOptionService.remove(+id);
    }
}