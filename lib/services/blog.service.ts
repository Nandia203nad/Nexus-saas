import { prisma } from '../db';
import { AppError, ErrorMessages } from '../errors';
import { BlogInput, PaginationInput } from '../schemas';

export class BlogService {
  async getBlogs(params: PaginationInput, userPlan?: string) {
    const { page, limit, search, tag, category } = params;
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {
      published: true,
      ...(search && { OR: [{ title: { contains: search } }, { excerpt: { contains: search } }] }),
      ...(tag && { tags: { some: { tag: { slug: tag } } } }),
      ...(category && { category }),
    };
    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id:true, name:true, avatar:true, level:true, plan:true } },
          tags: { include: { tag: true } },
          _count: { select: { comments:true, likes:true } },
        },
      }),
      prisma.blog.count({ where }),
    ]);
    const planRank = { FREE: 0, PREMIUM: 1, MAX: 2 };
    const userRank = planRank[(userPlan as keyof typeof planRank) || 'FREE'] || 0;
    return {
      blogs: blogs.map(blog => ({
        ...blog,
        isLocked: planRank[blog.minPlan as keyof typeof planRank] > userRank,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getBlogById(id: string, userPlan?: string) {
    const blog = await prisma.blog.findUnique({
      where: { id, published: true },
      include: {
        author: { select: { id:true, name:true, avatar:true, level:true, xp:true } },
        tags: { include: { tag: true } },
        comments: { include: { author: { select: { id:true, name:true, avatar:true, level:true } } }, orderBy: { createdAt: 'desc' } },
        _count: { select: { likes:true, bookmarks:true } },
      },
    });
    if (!blog) throw new AppError(ErrorMessages.BLOG_NOT_FOUND, 404, 'BLOG_NOT_FOUND');
    const planRank = { FREE: 0, PREMIUM: 1, MAX: 2 };
    const userRank = planRank[(userPlan as keyof typeof planRank) || 'FREE'] || 0;
    if (planRank[blog.minPlan as keyof typeof planRank] > userRank) {
      throw new AppError(ErrorMessages.BLOG_PREMIUM, 403, 'PLAN_REQUIRED');
    }
    await prisma.blog.update({ where: { id }, data: { views: { increment: 1 } } });
    return blog;
  }

  async createBlog(data: BlogInput, authorId: string) {
    const { tags, ...blogData } = data;
    const blog = await prisma.blog.create({
      data: {
        ...blogData,
        authorId,
        readTime: Math.max(1, Math.ceil((blogData.content.split(/\s+/).length) / 200)),
        ...(tags && tags.length > 0 && {
          tags: {
            create: await Promise.all(tags.map(async (tagName) => {
              const slug = tagName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
              const tag = await prisma.tag.upsert({ where: { slug }, create: { name: tagName, slug }, update: {} });
              return { tagId: tag.id };
            })),
          },
        }),
      },
      include: { author: { select: { id:true, name:true, avatar:true, level:true } }, tags: { include: { tag: true } }, _count: { select: { comments:true, likes:true } } },
    });
    await prisma.user.update({ where: { id: authorId }, data: { xp: { increment: 50 } } });
    return blog;
  }

  async updateBlog(id: string, data: Partial<BlogInput>, userId: string) {
    const blog = await prisma.blog.findUnique({ where: { id } });
    if (!blog) throw new AppError(ErrorMessages.BLOG_NOT_FOUND, 404, 'BLOG_NOT_FOUND');
    if (blog.authorId !== userId) throw new AppError(ErrorMessages.FORBIDDEN, 403, 'FORBIDDEN');
    const { tags, ...blogData } = data;
    return prisma.blog.update({ where: { id }, data: blogData, include: { author: { select: { id:true, name:true, avatar:true, level:true } }, tags: { include: { tag: true } }, _count: { select: { comments:true, likes:true } } } });
  }

  async deleteBlog(id: string, userId: string, role: string) {
    const blog = await prisma.blog.findUnique({ where: { id } });
    if (!blog) throw new AppError(ErrorMessages.BLOG_NOT_FOUND, 404, 'BLOG_NOT_FOUND');
    if (blog.authorId !== userId && role !== 'ADMIN') throw new AppError(ErrorMessages.FORBIDDEN, 403, 'FORBIDDEN');
    await prisma.blog.delete({ where: { id } });
    return { message: 'Блог устгагдлаа' };
  }

  async toggleLike(blogId: string, userId: string) {
    const existing = await prisma.like.findUnique({ where: { userId_blogId: { userId, blogId } } });
    if (existing) { await prisma.like.delete({ where: { userId_blogId: { userId, blogId } } }); return { liked: false }; }
    await prisma.like.create({ data: { userId, blogId } });
    await prisma.user.update({ where: { id: userId }, data: { xp: { increment: 5 } } });
    return { liked: true };
  }

  async toggleBookmark(blogId: string, userId: string) {
    const existing = await prisma.bookmark.findUnique({ where: { userId_blogId: { userId, blogId } } });
    if (existing) { await prisma.bookmark.delete({ where: { userId_blogId: { userId, blogId } } }); return { bookmarked: false }; }
    await prisma.bookmark.create({ data: { userId, blogId } });
    return { bookmarked: true };
  }
}
export const blogService = new BlogService();
