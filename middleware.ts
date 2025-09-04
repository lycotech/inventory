import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    const sessionToken = req.cookies.get("session_token")?.value;
    
    if (!sessionToken) {
      const url = req.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    // Define restricted paths for basic users (role: "user")
    // We'll handle role checking in the individual page components and API routes
    const basicUserRestrictedPaths = [
      "/dashboard/inventory", // Manage Stock
      "/dashboard/inventory/stock-out", // Stock Out
      "/dashboard/warehouse-transfer", // Warehouse Management
      "/dashboard/import", // Import Data
      "/dashboard/users", // Users
      "/dashboard/backup", // Backup
      "/dashboard/settings", // Settings
    ];

    const currentPath = req.nextUrl.pathname;
    
    // Add a header to indicate restricted paths for client-side handling
    const isRestrictedPath = basicUserRestrictedPaths.some(path => 
      currentPath === path || currentPath.startsWith(path + "/")
    );
    
    if (isRestrictedPath) {
      // Add header to indicate this is a restricted path
      // The page components will check user role and handle access control
      const response = NextResponse.next();
      response.headers.set("x-restricted-path", "true");
      return response;
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
