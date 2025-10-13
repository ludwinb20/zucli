// Context Types
export interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: {
    id: string;
    name: string;
  };
  specialty?: {
    id: string;
    name: string;
  };
}

export interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleCollapsed: () => void;
}

