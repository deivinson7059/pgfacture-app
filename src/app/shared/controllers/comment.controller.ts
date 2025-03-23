import { Controller, Get, Post, Body, Param, Delete, Query, UseInterceptors, ClassSerializerInterceptor, UsePipes, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common';

import { CommentService } from '@shared/services';
import { CreateCommentDto } from '@shared/dto';
import { Comment } from '@shared/entities';

import { ApplyDecorators, CheckCmpy } from '@common/decorators';
import { ParamSource } from '@common/enums';
import { apiResponse } from '@common/interfaces';

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
        @Query('module') module: string,
        @Query('includePrivate') includePrivate?: string
    ): Promise<apiResponse<Comment[]>> {
        const includePrivateFlag = includePrivate === 'true';
        const comments = await this.commentService.findByReference(cmpy, ref, module, includePrivateFlag);
        return {
            message: 'Comentarios encontrados para la referencia',
            data: comments
        };
    }

    @Get('reference2')
    @HttpCode(HttpStatus.OK)
    async findByReference2(
        @Query('cmpy') cmpy: string,
        @Query('ref2') ref2: string,
        @Query('module') module: string,
        @Query('includePrivate') includePrivate?: string
    ): Promise<apiResponse<Comment[]>> {
        const includePrivateFlag = includePrivate === 'true';
        const comments = await this.commentService.findByReference2(cmpy, ref2, module, includePrivateFlag);
        return {
            message: 'Comentarios encontrados para la referencia secundaria',
            data: comments
        };
    }

    @Get('module')
    @HttpCode(HttpStatus.OK)
    async findByModule(
        @Query('cmpy') cmpy: string,
        @Query('module') module: string,
        @Query('includePrivate') includePrivate?: string
    ): Promise<apiResponse<Comment[]>> {
        const includePrivateFlag = includePrivate === 'true';
        const comments = await this.commentService.findByModule(cmpy, module, includePrivateFlag);
        return {
            message: `Comentarios encontrados para el módulo ${module}`,
            data: comments
        };
    }

    @Get('system')
    @HttpCode(HttpStatus.OK)
    async findSystemGenerated(
        @Query('cmpy') cmpy: string,
        @Query('module') module: string
    ): Promise<apiResponse<Comment[]>> {
        const comments = await this.commentService.findSystemGenerated(cmpy, module);
        return {
            message: `Comentarios generados por el sistema para el módulo ${module}`,
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

    // Endpoint para crear comentarios del sistema
    @Post('system')
    @HttpCode(HttpStatus.CREATED)
    async createSystemComment(
        @Body() createSystemComment: {
            cmpy: string,
            ware: string,
            ref: string,
            ref2?: string,
            module: string,
            comment: string
        }
    ): Promise<apiResponse<Comment>> {
        const comment = await this.commentService.createSystemComment(
            createSystemComment.cmpy,
            createSystemComment.ware,
            createSystemComment.ref,
            createSystemComment.ref2 || null,
            createSystemComment.module,
            createSystemComment.comment
        );

        return {
            message: 'Comentario del sistema creado exitosamente',
            data: comment
        };
    }
}