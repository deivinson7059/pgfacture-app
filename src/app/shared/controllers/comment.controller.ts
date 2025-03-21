import { Controller, Get, Post, Body, Param, Delete, Query, UseInterceptors, ClassSerializerInterceptor, UsePipes, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { CommentService } from '../services/comment.service';
import { CreateCommentDto } from '../dto';
import { Comment } from '../entities';
import { ApplyDecorators, CheckCmpy } from 'src/app/common/decorators';
import { ParamSource } from 'src/app/common/enums';
import { apiResponse } from 'src/app/common/interfaces/common.interface';

@Controller('comments')
@UseInterceptors(ClassSerializerInterceptor)
export class CommentController {
    constructor(private readonly commentService: CommentService) { }

    @Post()
    @ApplyDecorators([
        CheckCmpy(ParamSource.BODY),
        UsePipes(new ValidationPipe({ transform: true }))
    ])
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createCommentDto: CreateCommentDto): Promise<apiResponse<Comment>> {
        const comment = await this.commentService.create(createCommentDto);
        return {
            message: 'Comentario creado exitosamente',
            data: comment
        };
    }

    @Get('reference')
    @HttpCode(HttpStatus.OK)
    async findByReference(
        @Query('cmpy') cmpy: string,
        @Query('ref') ref: string,
        @Query('table') table: string
    ): Promise<apiResponse<Comment[]>> {
        const comments = await this.commentService.findByReference(cmpy, ref, table);
        return {
            message: 'Comentarios encontrados para la referencia',
            data: comments
        };
    }

    @Get('table')
    @HttpCode(HttpStatus.OK)
    async findByTable(
        @Query('cmpy') cmpy: string,
        @Query('table') table: string
    ): Promise<apiResponse<Comment[]>> {
        const comments = await this.commentService.findByTable(cmpy, table);
        return {
            message: `Comentarios encontrados para la tabla ${table}`,
            data: comments
        };
    }

    @Get(':cmpy/:id')
    @HttpCode(HttpStatus.OK)
    async findOne(
        @Param('cmpy') cmpy: string,
        @Param('id') id: string
    ): Promise<apiResponse<Comment>> {
        const comment = await this.commentService.findOne(+id, cmpy);
        return {
            message: 'Detalle de comentario',
            data: comment
        };
    }

    @Delete(':cmpy/:id')
    @HttpCode(HttpStatus.OK)
    async remove(
        @Param('cmpy') cmpy: string,
        @Param('id') id: string
    ): Promise<apiResponse<void>> {
        await this.commentService.deleteComment(+id, cmpy);
        return {
            message: 'Comentario eliminado exitosamente',
            data: undefined
        };
    }
}