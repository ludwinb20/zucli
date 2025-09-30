declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      username: string;
      name: string;
      email?: string;
      role: {
        id: string;
        name: string;
      };
    };
  }

  interface User {
    id: string;
    username: string;
    name: string;
    email?: string;
    role: {
      id: string;
      name: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: string;
    role: {
      id: string;
      name: string;
    };
  }
}

export declare module 'next-auth' {}