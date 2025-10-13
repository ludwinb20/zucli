import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { AuthRole } from '@/types/auth';
import { AuthUser } from '@/types/contexts';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Usuario', type: 'text' },
        password: { label: 'Contraseña', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          // Buscar usuario por username
          const user = await prisma.user.findUnique({
            where: {
              username: credentials.username,
            },
            include: {
              role: true,
              specialty: true,
            },
          });

          if (!user || !user.isActive) {
            return null;
          }

          // Verificar contraseña
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          // Retornar datos del usuario para la sesión
          return {
            id: user.id,
            username: user.username,
            name: user.name,
            role: {
              id: user.role.id,
              name: user.role.name,
            },
            specialty: user.specialty ? {
              id: user.specialty.id,
              name: user.specialty.name,
            } : undefined,
          };
        } catch (error) {
          console.error('Error during authentication:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as AuthUser).username;
        token.role = (user as AuthUser).role;
        token.specialty = (user as AuthUser).specialty;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as AuthRole;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
