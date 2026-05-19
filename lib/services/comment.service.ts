import { prisma } from '../db';
import { AppError, ErrorMessages } from '../errors';
import { CommentInput } from '../schemas';

export class CommentService {
  async createComment(data: CommentInput, authorId: string) {
    const blog = await prisma.blog.findUnique({ where: { id: data.blogId } });
    if (!blog) throw new AppError(ErrorMessages.BLOG_NOT_FOUND, 404, 'BLOG_NOT_FOUND');
    const comment = await prisma.comment.create({
      data: { content: data.content, blogId: data.blogId, authorId },
      include: { author: { select: { id:true, name:true, avatar:true, level:true } } },
    });
    await prisma.user.update({ where: { id: authorId }, data: { xp: { increment: 10 } } });
    return comment;
  }

  async getComments(blogId: string) {
    return prisma.comment.findMany({ where: { blogId }, include: { author: { select: { id:true, name:true, avatar:true, level:true } } }, orderBy: { createdAt: 'desc' } });
  }

  async deleteComment(id: string, userId: string, role: string) {
    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new AppError('Сэтгэгдэл олдсонгүй', 404, 'NOT_FOUND');
    if (comment.authorId !== userId && role !== 'ADMIN') throw new AppError(ErrorMessages.FORBIDDEN, 403, 'FORBIDDEN');
    await prisma.comment.delete({ where: { id } });
    return { message: 'Сэтгэгдэл устгагдлаа' };
  }
}
export const commentService = new CommentService();
