"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { XCircle } from "lucide-react";

interface User {
  id: number;
  username: string;
  role: "admin" | "manager" | "user";
  isActive: boolean;
}

interface AccessControlProps {
  children: React.ReactNode;
  requiredRoles?: ("admin" | "manager" | "user")[];
  fallbackPath?: string;
  showError?: boolean;
}

export function AccessControl({ 
  children, 
  requiredRoles = ["admin", "manager"], 
  fallbackPath = "/dashboard",
  showError = true 
}: AccessControlProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) {
          router.push("/");
          return;
        }
        
        const data = await res.json();
        const currentUser = data.user as User;
        setUser(currentUser);

        // Check if user has required role
        if (!requiredRoles.includes(currentUser.role)) {
          setAccessDenied(true);
          if (!showError) {
            router.push(`${fallbackPath}?error=access_denied`);
          }
        }
      } catch (error) {
        console.error("Access check failed:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [requiredRoles, fallbackPath, showError, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (accessDenied && showError) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don't have permission to access this area. This feature requires{" "}
            {requiredRoles.length === 1 ? `${requiredRoles[0]} access` : `${requiredRoles.slice(0, -1).join(", ")} or ${requiredRoles.slice(-1)} access`}.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => router.push(fallbackPath)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Return to Dashboard
            </button>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Current role: <span className="font-medium capitalize">{user?.role}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (accessDenied && !showError) {
    return null; // Will redirect
  }

  return <>{children}</>;
}

// Higher-order component for easy wrapping
export function withAccessControl<P extends object>(
  Component: React.ComponentType<P>,
  requiredRoles: ("admin" | "manager" | "user")[] = ["admin", "manager"]
) {
  return function AccessControlledComponent(props: P) {
    return (
      <AccessControl requiredRoles={requiredRoles}>
        <Component {...props} />
      </AccessControl>
    );
  };
}
