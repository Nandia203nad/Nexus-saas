import { z } from 'zod';
export const registerSchema = z.object({
  email: z.string().email('Зөв имэйл оруулна уу'),
  password: z.string().min(8, 'Нууц үг хамгийн багадаа 8 тэмдэгт'),
  name: z.string().min(2).max(50),
});
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export const googleAuthSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(80).optional(),
  avatar: z.string().url().optional(),
});
export const blogSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.string().min(100),
  excerpt: z.string().max(300).optional(),
  coverImage: z.string().optional(),
  isPremium: z.boolean().default(false),
  minPlan: z.enum(['FREE','PREMIUM','MAX']).default('FREE'),
  published: z.boolean().default(false),
  category: z.string().default('general'),
  tags: z.array(z.string()).optional(),
});
export const commentSchema = z.object({
  content: z.string().min(1).max(1000),
  blogId: z.string().min(1),
});
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().optional(),
  tag: z.string().optional(),
  category: z.string().optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
export type BlogInput = z.infer<typeof blogSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
