import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import redis from '../lib/redis';

const ACCESS_SECRET = process.env.JWT_SECRET as string;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

const generateTokens = (user: { id: string; email: string; role: string; companyId: string }) => {
    const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role, companyId: user.companyId },
        ACCESS_SECRET,
        { expiresIn: ACCESS_EXPIRES } as jwt.SignOptions
    );
    const refreshToken = jwt.sign(
        { id: user.id },
        REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRES } as jwt.SignOptions
    );
    return { accessToken, refreshToken };
};

// POST /api/auth/register
export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role, companyId } = req.body;
        if (!name || !email || !password || !companyId) {
            return res.status(400).json({ error: 'name, email, password, companyId are required' });
        }
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(409).json({ error: 'Email already registered' });

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
            data: { name, email, passwordHash, role: role || 'DISPATCHER', companyId },
        });

        const { accessToken, refreshToken } = generateTokens({
            id: user.id, email: user.email, role: user.role, companyId: user.companyId,
        });

        // Store refresh token in Redis (TTL 7 days)
        await redis.set(`refresh:${user.id}`, refreshToken, 'EX', 7 * 24 * 60 * 60);

        return res.status(201).json({
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            accessToken,
            refreshToken,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

        const { accessToken, refreshToken } = generateTokens({
            id: user.id, email: user.email, role: user.role, companyId: user.companyId,
        });

        await redis.set(`refresh:${user.id}`, refreshToken, 'EX', 7 * 24 * 60 * 60);

        return res.json({
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            accessToken,
            refreshToken,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// POST /api/auth/refresh
export const refresh = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

        const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as { id: string };
        const stored = await redis.get(`refresh:${decoded.id}`);
        if (!stored || stored !== refreshToken) {
            return res.status(401).json({ error: 'Invalid or expired refresh token' });
        }

        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) return res.status(401).json({ error: 'User not found' });

        const { accessToken, refreshToken: newRefresh } = generateTokens({
            id: user.id, email: user.email, role: user.role, companyId: user.companyId,
        });

        await redis.set(`refresh:${user.id}`, newRefresh, 'EX', 7 * 24 * 60 * 60);

        return res.json({ accessToken, refreshToken: newRefresh });
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
};

// POST /api/auth/logout
export const logout = async (req: Request, res: Response) => {
    try {
        const { refreshToken } = req.body;
        if (refreshToken) {
            const decoded = jwt.decode(refreshToken) as { id: string } | null;
            if (decoded?.id) await redis.del(`refresh:${decoded.id}`);
        }
        return res.json({ message: 'Logged out successfully' });
    } catch {
        return res.json({ message: 'Logged out' });
    }
};
