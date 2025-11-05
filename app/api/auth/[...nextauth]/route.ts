import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { comparePassword, handleSuccessfulLogin, handleFailedLogin, createSession } from '@/lib/auth';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        try {
          await connectDB();
          
          const user = await User.findOne({ 
            email: credentials.email.toLowerCase() 
          });

          if (!user) {
            throw new Error('Invalid credentials');
          }

          // Check if account is locked
          if (user.security.lockUntil && user.security.lockUntil > new Date()) {
            throw new Error('Account temporarily locked due to too many failed login attempts');
          }

          // Check if account is banned or inactive
          if (user.isBanned) {
            throw new Error('Account has been banned');
          }

          if (!user.isActive) {
            throw new Error('Account is inactive');
          }

          // Verify password
          const isValidPassword = await comparePassword(credentials.password, user.password);
          
          if (!isValidPassword) {
            await handleFailedLogin(user);
            throw new Error('Invalid credentials');
          }

          // Handle successful login
          await handleSuccessfulLogin(user);

          // Return user session data
          return createSession(user);
        } catch (error) {
          console.error('Authentication error:', error);
          throw error;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400') // 24 hours default
  },
  jwt: {
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400')
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.permissions = user.permissions;
        token.username = user.username;
        token.isVerified = user.isVerified;
        token.emailVerified = user.emailVerified;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.permissions = token.permissions as string[];
        session.user.username = token.username as string;
        session.user.isVerified = token.isVerified as boolean;
        session.user.emailVerified = token.emailVerified as boolean;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
    signUp: '/auth/signup',
    error: '/auth/error'
  },
  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log(`User ${user.email} signed in`);
    },
    async signOut({ session, token }) {
      console.log(`User signed out`);
    }
  },
  debug: process.env.NODE_ENV === 'development'
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };