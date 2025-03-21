import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, QueryRunner } from 'typeorm';
import { Comment } from '../entities';
import { CreateCommentDto } from '../dto';

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
                co_table: createCommentDto.table,
                co_comment: createCommentDto.comment,
                co_enter: createCommentDto.enter,
                co_user_enter: createCommentDto.user_enter
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

    async findByReference(cmpy: string, ref: string, table: string): Promise<Comment[]> {
        const comments = await this.commentRepository.find({
            where: {
                co_cmpy: cmpy,
                co_ref: ref,
                co_table: table
            },
            order: {
                co_date_in: 'DESC'
            }
        });

        return comments;
    }

    async findByTable(cmpy: string, table: string): Promise<Comment[]> {
        const comments = await this.commentRepository.find({
            where: {
                co_cmpy: cmpy,
                co_table: table
            },
            order: {
                co_date_in: 'DESC'
            }
        });

        return comments;
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