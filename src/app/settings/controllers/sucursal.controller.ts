import { Controller, UseInterceptors, ClassSerializerInterceptor, Body, Delete, Get, Param, Post, Put } from "@nestjs/common";
import { SucursalService } from "../services/sucursal.service";
import { CreateSucursalDto, UpdateSucursalDto } from "../dto";

@Controller('settings/sucursal')
@UseInterceptors(ClassSerializerInterceptor)
export class SucursalController {
    constructor(
        private readonly sucursalService: SucursalService,
    ) { }

    /**
   * Sucursal
   **/
    @Post()
    createSucursal(@Body() createucursalDto: CreateSucursalDto) {
        return this.sucursalService.create(createucursalDto);
    }

    @Get(':cmpy')
    findAllSucursal(@Param('cmpy') cmpy: string) {
        return this.sucursalService.findAll(cmpy);
    }

    @Get(':cmpy/:ware')
    findOne(@Param('cmpy') cmpy: string, @Param('ware') ware: string) {
        return this.sucursalService.findOne(cmpy, ware);
    }

    @Put(':cmpy/:ware')
    updateSucursal(
        @Param('cmpy') cmpy: string,
        @Param('ware') ware: string,
        @Body() updateucursalDto: UpdateSucursalDto,
    ) {
        return this.sucursalService.update(cmpy, ware, updateucursalDto);
    }

    @Delete(':cmpy/:ware')
    removeSucursal(@Param('cmpy') cmpy: string, @Param('ware') ware: string) {
        return this.sucursalService.remove(cmpy, ware);
    }
    /**
    * Fin Sucursal
    **/

}