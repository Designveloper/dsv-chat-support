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
  confirmEmail: (email: string, code: string) => Promise<boolean>;
  resendConfirmation: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
  resetPassword: (email: string, code: string, newPassword: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const clearError = () => setError(null);

  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = authService.getAccessToken();
      if (token) {
        try {
          const userData = await authService.getUserProfile();
          setUser(userData);
          setIsAuthenticated(true);
          console.log("Authenticated", userData);
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
      await authService.signup(email, password);
      // authService.saveTokens(response.accessToken);
      // setIsAuthenticated(true);
      // setUser({ email });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to signup");
      setIsAuthenticated(false);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const confirmEmail = async (email: string, code: string) => {
    setLoading(true);
    setError(null);
    try {
      await authService.confirmEmail(email, code);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm email");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resendConfirmation = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      await authService.resendConfirmation(email);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to resend confirmation code"
      );
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      await authService.forgotPassword(email);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    setLoading(true);
    setError(null);
    try {
      await authService.resetPassword(email, code, newPassword);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
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

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    confirmEmail,
    resendConfirmation,
    forgotPassword,
    resetPassword,
    logout,
    clearError,
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
