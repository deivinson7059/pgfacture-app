import { Controller, UseInterceptors, ClassSerializerInterceptor, Body, Delete, Get, Param, Post, Put, HttpCode, HttpStatus, UsePipes, ValidationPipe } from "@nestjs/common";
import { SucursalService } from "../services/sucursal.service";
import { CreateSucursalDto, UpdateSucursalDto } from "../dto";
import { ApplyDecorators, CheckCmpy, CheckWare } from "@common/decorators";
import { ParamSource } from "@common/enums";

@Controller('settings/sucursal')
@UseInterceptors(ClassSerializerInterceptor)
export class SucursalController {
    constructor(
        private readonly sucursalService: SucursalService,
    ) { }

    @Post()
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.PARAMS),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    createSucursal(@Body() createucursalDto: CreateSucursalDto) {
        return this.sucursalService.create(createucursalDto);
    }

    @Get(':cmpy')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.PARAMS),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    findAllSucursal(@Param('cmpy') cmpy: string) {
        return this.sucursalService.findAll(cmpy);
    }

    @Get(':cmpy/:ware')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.PARAMS),
        CheckWare(ParamSource.PARAMS),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    findOne(@Param('cmpy') cmpy: string, @Param('ware') ware: string) {
        return this.sucursalService.findOne(cmpy, ware);
    }

    @Put(':cmpy/:ware')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.PARAMS),
        CheckWare(ParamSource.PARAMS),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    updateSucursal(
        @Param('cmpy') cmpy: string,
        @Param('ware') ware: string,
        @Body() updateucursalDto: UpdateSucursalDto,
    ) {
        return this.sucursalService.update(cmpy, ware, updateucursalDto);
    }

    @Delete(':cmpy/:ware')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.PARAMS),
        CheckWare(ParamSource.PARAMS),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    removeSucursal(@Param('cmpy') cmpy: string, @Param('ware') ware: string) {
        return this.sucursalService.remove(cmpy, ware);
    }

}