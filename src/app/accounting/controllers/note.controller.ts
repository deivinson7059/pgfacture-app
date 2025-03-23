import { Controller, Get, Post, Body, Param, Query, Put, UseInterceptors, ClassSerializerInterceptor, UsePipes, ValidationPipe, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';

import { NoteService } from '@accounting/services';

import { ApplyDecorators, CheckCmpy, CheckWare } from '@common/decorators';

import { CreateNoteDto, UpdateNoteStatusDto, EditNoteDto, AnulateNoteDto, ApproveNoteDto } from '@accounting/dto';
import { ParamSource } from '@common/enums';
import { NoteWithLines } from '@accounting/interfaces';
import { apiResponse } from '@common/interfaces';

@Controller('accounting/notes')
@UseInterceptors(ClassSerializerInterceptor)
export class NoteController {
    constructor(private readonly accountingNoteService: NoteService) { }

    @Post()
    @ApplyDecorators([
        CheckCmpy(ParamSource.BODY),
        CheckWare(ParamSource.BODY),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    @HttpCode(HttpStatus.OK)
    async create(@Body() createNoteDto: CreateNoteDto): Promise<apiResponse<NoteWithLines>> {
        // Aseguramos que se guarde en estado abierto/pendiente sin asientos
        const note = await this.accountingNoteService.create(createNoteDto);

        return {
            message: 'Nota contable creada exitosamente en estado Pendiente',
            data: note
        };
    }

    @Put('edit/:cmpy/:id')
    @ApplyDecorators([
        CheckCmpy(ParamSource.PARAMS),
        CheckWare(ParamSource.BODY),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    @HttpCode(HttpStatus.OK)
    async edit(
        @Param('cmpy') cmpy: string,
        @Param('id') id: number,
        @Body() editNoteDto: EditNoteDto
    ): Promise<apiResponse<NoteWithLines>> {
        const note = await this.accountingNoteService.editNote(cmpy, id, editNoteDto);

        return {
            message: `Nota contable ${id} editada exitosamente`,
            data: note
        };
    }

    @Put('anulate/:cmpy/:id')
    @ApplyDecorators([
        CheckCmpy(ParamSource.PARAMS),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    @HttpCode(HttpStatus.OK)
    async anulate(
        @Param('cmpy') cmpy: string,
        @Param('id') id: number,
        @Body() anulateNoteDto: AnulateNoteDto
    ): Promise<apiResponse<NoteWithLines>> {
        const note = await this.accountingNoteService.anulateNote(cmpy, id, anulateNoteDto);

        return {
            message: `Nota contable ${id} anulada: ${anulateNoteDto.justification}`,
            data: note
        };
    }

    @Put('approve/:cmpy/:id')
    @ApplyDecorators([
        CheckCmpy(ParamSource.PARAMS),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    @HttpCode(HttpStatus.OK)
    async approve(
        @Param('cmpy') cmpy: string,
        @Param('id') id: number,
        @Body() approveNoteDto: ApproveNoteDto
    ): Promise<apiResponse<NoteWithLines>> {
        const note = await this.accountingNoteService.approveNote(cmpy, id, approveNoteDto);

        return {
            message: `Nota contable ${id} aprobada y contabilizada`,
            data: note
        };
    }

    @Get(':cmpy')
    @HttpCode(HttpStatus.OK)
    async findAll(
        @Param('cmpy') cmpy: string,
        @Query('date_ini') date_ini: Date,
        @Query('date_end') date_end: Date,
        @Query('status') status?: string
    ): Promise<apiResponse<any>> {

        //validamos que las fechas sean correctas
        if (!date_ini || !date_end) {
            throw new BadRequestException('Las fechas de inicio y fin son requeridas');
        }
        if (date_ini > date_end) {
            throw new BadRequestException('La fecha de inicio no puede ser mayor a la fecha final');
        }

        if (status && !['P', 'A', 'R', 'C', 'X'].includes(status)) {
            throw new BadRequestException('El estado de la nota contable no es válido');
        }
        const notes = await this.accountingNoteService.findAll(cmpy, date_ini, date_end, status);
        return {
            message: 'Notas contables',
            data: notes
        };
    }

    @Get(':cmpy/:id')
    async findOne(@Param('cmpy') cmpy: string, @Param('id') id: number): Promise<apiResponse<NoteWithLines>> {
        const note = await this.accountingNoteService.getNoteInfo(cmpy, id);
        return {
            message: 'Detalle de nota contable',
            data: note
        };
    }

    @Put('status')
    @UsePipes(new ValidationPipe({ transform: true }))
    @HttpCode(HttpStatus.OK)
    async updateStatus(@Body() updateStatusDto: UpdateNoteStatusDto): Promise<apiResponse<any>> {
        const note = await this.accountingNoteService.updateStatus(updateStatusDto);

        let message = '';
        switch (note.status) {
            case 'P': message = 'Nota contable en estado pendiente'; break;
            case 'A': message = 'Nota contable aprobada'; break;
            case 'R': message = 'Nota contable rechazada'; break;
            case 'C': message = 'Nota contable contabilizada'; break;
            case 'X': message = 'Nota contable anulada'; break;
        }

        return {
            message,
            data: note
        };
    }
}