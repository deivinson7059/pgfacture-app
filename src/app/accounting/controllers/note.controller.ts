import { Controller, Get, Post, Body, Param, Query, Put, UseInterceptors, ClassSerializerInterceptor, UsePipes, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common';

import { NoteService } from '@accounting/services';

import { ApplyDecorators, CheckCmpy, CheckWare } from '@common/decorators';

import { CreateNoteDto, UpdateNoteStatusDto } from '@accounting/dto';
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
        const note = await this.accountingNoteService.create(createNoteDto);

        let message = 'Nota contable creada exitosamente';
        if (note.auto_accounting) {
            message += ' y contabilizada automáticamente';
        }

        return {
            message,
            data: note
        };
    }

    @Get()
    @HttpCode(HttpStatus.OK)
    async findAll(
        @Query('cmpy') cmpy: string,
        @Query('year') year?: number,
        @Query('per') per?: number,
        @Query('status') status?: string
    ): Promise<apiResponse<any>> {
        const notes = await this.accountingNoteService.findAll(cmpy, year, per, status);
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
        }

        return {
            message,
            data: note
        };
    }
}