import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import type { User } from '@prisma/client';
import { prisma } from './prisma';

const COOKIE_NAME = 'auth_token';
const JWT_EXPIRATION = '7d';

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(user: User) {
  const token = await new SignJWT({
    sub: user.id,
    role: user.role,
    email: user.email,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRATION)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const userId = payload.sub as string | undefined;
    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    return user;
  } catch {
    return null;
  }
}

