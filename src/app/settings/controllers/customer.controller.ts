import { Controller, Get, Post, Body, Param, Delete, NotFoundException, Put, ClassSerializerInterceptor, UseInterceptors, HttpCode, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApplyDecorators, CheckCmpy } from '@common/decorators';
import { ParamSource } from '@common/enums';
import { apiResponse } from '@common/interfaces';
import { Customer } from '@settings/entities';
import { CustomerService } from '@settings/services';
import { CreateCustomerDto, UpdatePasswordDto } from '@settings/dto';

@Controller('settings/customer')
@UseInterceptors(ClassSerializerInterceptor)

export class CustomerController {
    constructor(
        private readonly customerService: CustomerService,
    ) { }

    @Post()
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.BODY),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async createCustomer(@Body() createCustomerDto: CreateCustomerDto): Promise<apiResponse<Customer>> {
        return this.customerService.saveCustomer(createCustomerDto);
    }

    @Get(':cmpy')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.PARAMS),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async findAllCustomers(@Param('cmpy') cmpy: string): Promise<apiResponse<Customer[]>> {
        return this.customerService.findAll(cmpy);
    }

    @Get(':cmpy/:identification')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.PARAMS),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async findOneCustomer(
        @Param('cmpy') cmpy: string,
        @Param('identification') identification: string
    ): Promise<apiResponse<Customer>> {
        const customer = await this.customerService.findOne(cmpy, identification);
        if (!customer) {
            throw new NotFoundException(`Tercero con identificación ${identification} no existe`);
        }
        return customer;
    }

    @Get(':cmpy/search/:datoBusq')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.PARAMS),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async findCustomers(
        @Param('cmpy') cmpy: string,
        @Param('datoBusq') datoBusq: string
    ): Promise<apiResponse<Customer[]>> {
        return this.customerService.findCustomers(cmpy, datoBusq);
    }

    @Delete(':cmpy/:identification')
    @HttpCode(HttpStatus.OK)
    @ApplyDecorators([
        CheckCmpy(ParamSource.PARAMS),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async removeCustomer(
        @Param('cmpy') cmpy: string,
        @Param('identification') identification: string
    ): Promise<apiResponse> {
        return this.customerService.remove(cmpy, identification);
    }

    @Put(':cmpy/:identification/password')
    @ApplyDecorators([
        CheckCmpy(ParamSource.PARAMS),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    async updatePassword(
        @Param('cmpy') cmpy: string,
        @Param('identification') identification: string,
        @Body() updatePasswordDto: UpdatePasswordDto
    ): Promise<apiResponse<{ success: boolean }>> {
        return this.customerService.updatePassword(cmpy, identification, updatePasswordDto);
    }
}