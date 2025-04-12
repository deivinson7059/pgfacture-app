import { Controller, UseInterceptors, ClassSerializerInterceptor, Body, Delete, Get, Param, Post, Put, HttpCode, HttpStatus, UsePipes, ValidationPipe, UseGuards } from "@nestjs/common";
import { SucursalService } from "../services/sucursal.service";
import { CreateSucursalDto, UpdateSucursalDto } from "../dto";
import { ApplyDecorators, CheckCmpy, CheckWare } from "@common/decorators";
import { ParamSource } from "@common/enums";
import { Public } from "@auth/decorators";
import { JwtAuthGuard, ScopesGuard } from "@auth/guards";

@Controller('settings/sucursal')
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard, ScopesGuard)
export class SucursalController {
    constructor(
        private readonly sucursalService: SucursalService,
    ) { }

    @Public()
    @Post()
    @HttpCode(HttpStatus.OK)
    /* @ApplyDecorators([
        CheckCmpy(ParamSource.BODY),
        UsePipes(new ValidationPipe({ transform: true }))
    ]) */
    createSucursal(@Body() createucursalDto: CreateSucursalDto) {
        console.log('createSucursal', createucursalDto);
        return createucursalDto;
        //this.sucursalService.create(createucursalDto);
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