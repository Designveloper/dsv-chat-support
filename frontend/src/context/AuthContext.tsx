import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { authService } from "../services/authService";

interface User {
  email: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = authService.getAccessToken();
      if (token) {
        try {
          const userData = await authService.getUserProfile();
          setUser(userData);
          setIsAuthenticated(true);
        } catch (err) {
          console.log("Failed to authenticate", err);
          authService.logout();
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(email, password);
      authService.saveTokens(response.accessToken);
      setIsAuthenticated(true);
      setUser({ email });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to login");
      setIsAuthenticated(false);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.signup(email, password);
      authService.saveTokens(response.accessToken);
      setIsAuthenticated(true);
      setUser({ email });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to signup");
      setIsAuthenticated(false);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  console.log("user", user);

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    isAuthenticated,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
