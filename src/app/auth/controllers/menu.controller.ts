import { Controller, Get, Post, Body, Param, Delete, Put, UseInterceptors, ClassSerializerInterceptor, HttpCode, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { MenuService } from '../services/menu.service';

import { CreateMenuDto, UpdateMenuDto } from '@auth/dto';
import { Menu } from '@auth/entities';
import { apiResponse } from '@common/interfaces';
import { Public } from '@auth/decorators';

@Controller('menu')
@UseInterceptors(ClassSerializerInterceptor)
export class MenuController {
    constructor(private readonly menuService: MenuService) { }

    @Public()
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @UsePipes(new ValidationPipe({ transform: true }))
    async create(@Body() createMenuDto: CreateMenuDto): Promise<apiResponse<Menu>> {
        return this.menuService.create(createMenuDto);
    }

    @Public()
    @Get()
    @HttpCode(HttpStatus.OK)
    async findAll(): Promise<apiResponse<Menu[]>> {
        return this.menuService.findAll();
    }

    @Public()
    @Get(':id')
    @HttpCode(HttpStatus.OK)
    async findOne(@Param('id') id: string): Promise<apiResponse<Menu>> {
        return this.menuService.findOne(+id);
    }

    @Public()
    @Put(':id')
    @HttpCode(HttpStatus.OK)
    @UsePipes(new ValidationPipe({ transform: true }))
    async update(
        @Param('id') id: string,
        @Body() updateMenuDto: UpdateMenuDto
    ): Promise<apiResponse<Menu>> {
        return this.menuService.update(+id, updateMenuDto);
    }

    @Public()
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    async remove(@Param('id') id: string): Promise<apiResponse<void>> {
        return this.menuService.remove(+id);
    }
}