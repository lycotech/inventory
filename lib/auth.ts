import 'server-only';
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const SESSION_COOKIE = "session_token";
const SESSION_TTL_DAYS = 7;
// Control whether to mark the cookie as Secure. If not explicitly set, default to NODE_ENV===production.
// On HTTP-only intranet deployments, set COOKIE_SECURE=false to allow the cookie over HTTP.
const COOKIE_SECURE = (() => {
  const v = process.env.COOKIE_SECURE;
  if (v === undefined) return process.env.NODE_ENV === "production";
  return !(v === "false" || v === "0");
})();

export async function createSession(userId: number) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await prisma.userSession.create({ data: { sessionToken: token, userId, expiresAt } });
  try {
    const jar = await cookies();
    jar.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
  secure: COOKIE_SECURE,
      expires: expiresAt,
      path: "/",
    });
  } catch {
    // No request context (e.g., build-time probe); ignore cookie set
  }
  return token;
}

export async function getSession() {
  try {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const session = await prisma.userSession.findUnique({ where: { sessionToken: token } });
    if (!session || session.expiresAt < new Date()) return null;
    const user = await prisma.user.findUnique({ 
      where: { id: session.userId }, 
      select: { 
        id: true, 
        username: true, 
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        address: true,
        profileImageUrl: true,
        role: true, 
        isActive: true,
        createdAt: true,
        lastLogin: true
      } 
    });
    if (!user || !user.isActive) return null;
    return { token, user };
  } catch {
    // No request context; treat as unauthenticated
    return null;
  }
}

export async function destroySession() {
  try {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
    if (token) {
      await prisma.userSession.delete({ where: { sessionToken: token } }).catch(() => {});
    }
    jar.delete(SESSION_COOKIE);
  } catch {
    // No request context; nothing to delete
  }
}

export async function authenticate(username: string, password: string) {
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.passwordHash) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok || !user.isActive) return null;
  // Update lastLogin asynchronously
  prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } }).catch(() => {});
  return user;
}

export async function getSessionWithPrivileges() {
  const session = await getSession();
  if (!session) return null;

  try {
    const userWithPrivileges = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        menuPermissions: true,
        warehouseAccess: true,
        operationPrivileges: true
      }
    });

    if (!userWithPrivileges) return null;

    // Transform privileges into a more usable format
    const menuPermissions: { [key: string]: boolean } = {};
    userWithPrivileges.menuPermissions.forEach(perm => {
      menuPermissions[perm.menuItem] = perm.canAccess;
    });

    const warehouseAccess: { [key: string]: { canView: boolean; canEdit: boolean; canTransfer: boolean } } = {};
    userWithPrivileges.warehouseAccess.forEach(access => {
      warehouseAccess[access.warehouseName] = {
        canView: access.canView,
        canEdit: access.canEdit,
        canTransfer: access.canTransfer
      };
    });

    const operationPrivileges: { [key: string]: boolean } = {};
    userWithPrivileges.operationPrivileges.forEach(priv => {
      operationPrivileges[priv.operation] = priv.hasAccess;
    });

    return {
      ...session,
      privileges: {
        menuPermissions,
        warehouseAccess,
        operationPrivileges
      }
    };
  } catch (error) {
    console.error("Error fetching session with privileges:", error);
    // Return session with empty privileges if fetch fails
    return {
      ...session,
      privileges: {
        menuPermissions: {},
        warehouseAccess: {},
        operationPrivileges: {}
      }
    };
  }
}

// Utility function to check if user has specific privilege
export async function hasPrivilege(userId: number, type: 'menu' | 'warehouse' | 'operation', key: string, permission?: string): Promise<boolean> {
  try {
    if (type === 'menu') {
      const menuPerm = await prisma.userMenuPermission.findUnique({
        where: { userId_menuItem: { userId, menuItem: key as any } }
      });
      return menuPerm?.canAccess || false;
    } else if (type === 'warehouse' && permission) {
      const warehousePerm = await prisma.userWarehouseAccess.findUnique({
        where: { userId_warehouseName: { userId, warehouseName: key } }
      });
      if (!warehousePerm) return false;
      if (permission === 'canView') return warehousePerm.canView;
      if (permission === 'canEdit') return warehousePerm.canEdit;
      if (permission === 'canTransfer') return warehousePerm.canTransfer;
      return false;
    } else if (type === 'operation') {
      const operationPerm = await prisma.userOperationPrivilege.findUnique({
        where: { userId_operation: { userId, operation: key as any } }
      });
      return operationPerm?.hasAccess || false;
    }
    return false;
  } catch (error) {
    console.error("Error checking privilege:", error);
    return false;
  }
}
