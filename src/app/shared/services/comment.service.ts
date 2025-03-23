import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';

import { Comment } from '@shared/entities';
import { CreateCommentDto } from '@shared/dto';

@Injectable()
export class CommentService {
    constructor(
        @InjectRepository(Comment)
        private commentRepository: Repository<Comment>,
        private dataSource: DataSource
    ) { }

    async create(createCommentDto: CreateCommentDto): Promise<Comment> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const nextId = await this.getNextCommentId(queryRunner, createCommentDto.cmpy);

            const comment = this.commentRepository.create({
                co_id: nextId,
                co_cmpy: createCommentDto.cmpy,
                co_ware: createCommentDto.ware,
                co_ref: createCommentDto.ref,
                co_ref2: createCommentDto.ref2 || null,
                co_module: createCommentDto.module,
                co_comment: createCommentDto.comment,
                co_user_enter: createCommentDto.user_enter,
                co_private: createCommentDto.private || false,
                co_system_generated: createCommentDto.system_generated || false
            });

            const savedComment = await queryRunner.manager.save(comment);
            await queryRunner.commitTransaction();

            return savedComment;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    async findByReference(cmpy: string, ref: string, module: string, includePrivate: boolean = false): Promise<Comment[]> {
        const queryBuilder = this.commentRepository.createQueryBuilder('comment')
            .where('comment.co_cmpy = :cmpy', { cmpy })
            .andWhere('comment.co_ref = :ref', { ref })
            .andWhere('comment.co_module = :module', { module });

        if (!includePrivate) {
            queryBuilder.andWhere('comment.co_private = :private', { private: false });
        }

        return queryBuilder
            .orderBy('comment.co_date_in', 'DESC')
            .getMany();
    }

    async findByReference2(cmpy: string, ref2: string, module: string, includePrivate: boolean = false): Promise<Comment[]> {
        const queryBuilder = this.commentRepository.createQueryBuilder('comment')
            .where('comment.co_cmpy = :cmpy', { cmpy })
            .andWhere('comment.co_ref2 = :ref2', { ref2 })
            .andWhere('comment.co_module = :module', { module });

        if (!includePrivate) {
            queryBuilder.andWhere('comment.co_private = :private', { private: false });
        }

        return queryBuilder
            .orderBy('comment.co_date_in', 'DESC')
            .getMany();
    }

    async findByModule(cmpy: string, module: string, includePrivate: boolean = false): Promise<Comment[]> {
        const queryBuilder = this.commentRepository.createQueryBuilder('comment')
            .where('comment.co_cmpy = :cmpy', { cmpy })
            .andWhere('comment.co_module = :module', { module });

        if (!includePrivate) {
            queryBuilder.andWhere('comment.co_private = :private', { private: false });
        }

        return queryBuilder
            .orderBy('comment.co_date_in', 'DESC')
            .getMany();
    }

    async findSystemGenerated(cmpy: string, module: string): Promise<Comment[]> {
        return this.commentRepository.find({
            where: {
                co_cmpy: cmpy,
                co_module: module,
                co_system_generated: true
            },
            order: {
                co_date_in: 'DESC'
            }
        });
    }

    async findOne(id: number, cmpy: string): Promise<Comment> {
        const comment = await this.commentRepository.findOne({
            where: {
                co_id: id,
                co_cmpy: cmpy
            }
        });

        if (!comment) {
            throw new NotFoundException(`Comentario con ID ${id} no encontrado para la compañía ${cmpy}`);
        }

        return comment;
    }

    async deleteComment(id: number, cmpy: string): Promise<void> {
        const result = await this.commentRepository.delete({
            co_id: id,
            co_cmpy: cmpy
        });

        if (result.affected === 0) {
            throw new NotFoundException(`Comentario con ID ${id} no encontrado para la compañía ${cmpy}`);
        }
    }

    // Método para crear comentarios de sistema automáticamente
    async createSystemComment(
        cmpy: string,
        ware: string,
        ref: string,
        ref2: string | null,
        module: string,
        comment: string
    ): Promise<Comment> {
        const createDto: CreateCommentDto = {
            cmpy,
            ware,
            ref,
            ref2,
            module,
            comment,
            user_enter: 'SYSTEM',
            system_generated: true,
            private: false // Por defecto los comentarios del sistema son públicos
        };

        return this.create(createDto);
    }

    async createComment(
        queryRunner: QueryRunner,
        createDto: CreateCommentDto
    ): Promise<Comment> {
        const nextId = await this.getNextCommentId(queryRunner, createDto.cmpy);

        const comment = this.commentRepository.create({
            co_id: nextId,
            co_cmpy: createDto.cmpy,
            co_ware: createDto.ware,
            co_ref: createDto.ref,
            co_ref2: createDto.ref2 || null,
            co_module: createDto.module,
            co_comment: createDto.comment,
            co_user_enter: createDto.user_enter,
            co_private: createDto.private || false,
            co_system_generated: createDto.system_generated || false
        });
        return queryRunner.manager.save(comment);
    }


    async getComments(cmpy: string, module: string, co_ref: string,): Promise<Comment[]> {
        const comment = await this.commentRepository.find({
            where: {
                co_ref: co_ref,
                co_cmpy: cmpy,
                co_module: module
            }
        });

        return comment;
    }
    private async getNextCommentId(queryRunner: QueryRunner, cmpy: string): Promise<number> {
        const result = await queryRunner.manager
            .createQueryBuilder()
            .select('COALESCE(MAX(comment.co_id), 0)', 'max')
            .from(Comment, 'comment')
            .where('comment.co_cmpy = :companyCode', { companyCode: cmpy })
            .getRawOne();

        return Number(result.max) + 1;
    }
}