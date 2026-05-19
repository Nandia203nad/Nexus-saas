import bcrypt from 'bcryptjs';
import { prisma } from '../db';
import { signToken } from '../auth';
import { AppError, ErrorMessages } from '../errors';
import { RegisterInput, LoginInput, GoogleAuthInput } from '../schemas';

export class AuthService {
  async register(data: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError(ErrorMessages.USER_EXISTS, 409, 'USER_EXISTS');
    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: { email: data.email, password: hashedPassword, name: data.name },
      select: { id:true, email:true, name:true, role:true, plan:true, xp:true, level:true, avatar:true },
    });
    const token = signToken({ userId: user.id, email: user.email, role: user.role, plan: user.plan });
    return { user, token };
  }

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw new AppError(ErrorMessages.INVALID_CREDENTIALS, 401, 'INVALID_CREDENTIALS');
    const isValid = await bcrypt.compare(data.password, user.password);
    if (!isValid) throw new AppError(ErrorMessages.INVALID_CREDENTIALS, 401, 'INVALID_CREDENTIALS');
    const token = signToken({ userId: user.id, email: user.email, role: user.role, plan: user.plan });
    const { password: _, ...userWithout } = user;
    return { user: userWithout, token };
  }

  async googleAuth(data: GoogleAuthInput) {
    const email = data.email.trim().toLowerCase();
    const fallbackName = email.split('@')[0];
    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        name: data.name?.trim() || fallbackName,
        avatar: data.avatar,
        password: await bcrypt.hash(`google:${email}:${process.env.JWT_SECRET || 'fallback-secret'}`, 12),
      },
      update: {
        name: data.name?.trim() || undefined,
        avatar: data.avatar || undefined,
      },
      select: { id:true, email:true, name:true, role:true, plan:true, xp:true, level:true, avatar:true },
    });
    const token = signToken({ userId: user.id, email: user.email, role: user.role, plan: user.plan });
    return { user, token };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id:true, email:true, name:true, avatar:true, bio:true, role:true, plan:true, xp:true, level:true, streak:true, createdAt:true,
        _count: { select: { blogs:true, comments:true, likes:true } },
        skills: { include: { skill: true } },
        achievements: { include: { achievement: true } },
        portfolioFiles: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!user) throw new AppError(ErrorMessages.USER_NOT_FOUND, 404, 'USER_NOT_FOUND');
    return user;
  }
}
export const authService = new AuthService();
