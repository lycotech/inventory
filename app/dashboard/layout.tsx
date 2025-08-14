import { getSession } from "@/lib/auth";
import { DashboardChrome } from "@/components/nav/dashboard-chrome";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Ensure user is authenticated (middleware also guards)
  const session = await getSession();
  if (!session) return null;

  return <DashboardChrome>{children}</DashboardChrome>;
}
