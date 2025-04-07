import { Controller, Get, Post, Body, Param, Delete, NotFoundException, Put, ClassSerializerInterceptor, UseInterceptors, Query } from '@nestjs/common';
import { apiResponse } from '../../common/interfaces/common.interface';
import { CreateCustomerDto, UpdateCustomerDto, ListCustomerDto } from '../dto';
import { Customer } from '../entities/customer.entity';
import { CustomerService } from '../services/customer.service';

@Controller('settings/customer')
@UseInterceptors(ClassSerializerInterceptor)
export class CustomerController {
    constructor(
        private readonly customerService: CustomerService,
    ) { }

    /**
    * Terceros
    **/
    @Post()
    async createCustomer(@Body() createCustomerDto: CreateCustomerDto): Promise<apiResponse<Customer>> {
        return this.customerService.create(createCustomerDto);
    }

    @Get(':cmpy')
    async findAllCustomers(@Param('cmpy') cmpy: string): Promise<apiResponse<Customer[]>> {
        return this.customerService.findAll(cmpy);
    }

    @Get(':cmpy/:identification')
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

    @Put(':cmpy/:identification')
    async updateCustomer(
        @Param('cmpy') cmpy: string,
        @Param('identification') identification: string,
        @Body() updateCustomerDto: UpdateCustomerDto
    ): Promise<apiResponse<Customer>> {
        return this.customerService.update(cmpy, identification, updateCustomerDto);
    }

    @Delete(':cmpy/:identification')
    async removeCustomer(
        @Param('cmpy') cmpy: string,
        @Param('identification') identification: string
    ): Promise<apiResponse> {
        return this.customerService.remove(cmpy, identification);
    }
    /**
     * Fin Terceros
     **/
}