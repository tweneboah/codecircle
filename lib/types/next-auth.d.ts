import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      username: string;
      role: string;
      permissions: string[];
      isVerified: boolean;
      emailVerified: boolean;
      image?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    username: string;
    role: string;
    permissions: string[];
    isVerified: boolean;
    emailVerified: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    permissions: string[];
    username: string;
    isVerified: boolean;
    emailVerified: boolean;
    csrfToken?: string;
  }
}