import { AppHeader } from "@/components/app-shell/app-header";
import { AppSidebar } from "@/components/app-shell/app-sidebar";
import { getCurrentUser } from "@/lib/auth";
import { getUserRelevantActivities } from "@/lib/activity-log";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  const activities = user ? await getUserRelevantActivities(user.id, 5) : [];

  return (
    <div className="min-h-dvh">
      <div className="hidden md:fixed md:inset-y-0 md:left-0 md:w-64 md:block border-r border-[hsl(var(--border))] bg-[hsl(var(--card))]">
        <AppSidebar />
      </div>

      <div className="md:pl-64">
        <AppHeader activities={activities} />
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}

