import { useNavigate } from '@tanstack/react-router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminPublicPostsList from './AdminPublicPostsList';
import AdminUserManagement from './AdminUserManagement';
import AdminInviteCodes from './AdminInviteCodes';
import AdminUserPostHistory from './AdminUserPostHistory';
import AdminSignup from './AdminSignup';
import AdminFlaggedPosts from './AdminFlaggedPosts';
import AdminFlaggedComments from './AdminFlaggedComments';
import AdminAllUsersTab from './AdminAllUsersTab';
import AdminEmotionalAlertsTab from './AdminEmotionalAlertsTab';
import { useAdminGetSeatCount, useAdminGetESPFlaggedUsers, useAdminClearESPFlag, useAdminGetEmotionalAlerts } from '../hooks/useQueries';
import { ArrowLeft, Users, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Principal } from '@dfinity/principal';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data: seatInfo, isLoading: seatLoading } = useAdminGetSeatCount();
  const { data: espUsers, isLoading: espLoading } = useAdminGetESPFlaggedUsers();
  const { data: emotionalAlerts } = useAdminGetEmotionalAlerts();
  const clearESPFlag = useAdminClearESPFlag();

  const currentSeats = seatInfo ? Number(seatInfo.currentSeats) : 0;
  const maxSeats = seatInfo ? Number(seatInfo.maxSeats) : 100;
  const emotionalAlertCount = emotionalAlerts?.length ?? 0;

  const handleClearESP = async (principalStr: string) => {
    try {
      await clearESPFlag.mutateAsync(Principal.fromText(principalStr));
    } catch {
      // silently handle
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate({ to: '/dashboard' })}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={15} />
          Dashboard
        </button>
      </div>

      <div className="space-y-1">
        <h1 className="font-serif text-2xl font-semibold text-foreground">Admin Panel</h1>
        <p className="text-sm text-muted-foreground">Manage the Veil community</p>
      </div>

      {/* Seat counter */}
      <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Users size={16} />
          <span className="text-sm font-medium text-foreground">Seat Usage</span>
        </div>
        {seatLoading ? (
          <Loader2 size={14} className="animate-spin text-muted-foreground" />
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{currentSeats}</span>
            <span className="text-sm text-muted-foreground">/ {maxSeats} seats filled</span>
            <div className="ml-2 h-2 w-24 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.min((currentSeats / maxSeats) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Emotional Monitoring Alert Banner */}
      {emotionalAlertCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-300/60 dark:border-amber-700/50 bg-amber-50/60 dark:bg-amber-950/20">
          <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
              Emotional Monitoring Alert
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              {emotionalAlertCount} user{emotionalAlertCount !== 1 ? 's have' : ' has'} posted 5+ BROKE posts in the last 3 days.
              Review in the <strong>Alerts</strong> tab.
            </p>
          </div>
        </div>
      )}

      {/* ESP Flagged Users */}
      {!espLoading && espUsers && espUsers.length > 0 && (
        <div className="p-4 bg-card border border-border rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-foreground">
              Emotional Stability Protocol — {espUsers.length} user{espUsers.length !== 1 ? 's' : ''} flagged
            </span>
          </div>
          <div className="space-y-2">
            {espUsers.map((principal: any) => {
              const principalStr = principal.toString();
              return (
                <div key={principalStr} className="flex items-center justify-between gap-2 py-1.5 border-t border-border/50">
                  <span className="text-xs font-mono text-muted-foreground">{principalStr.slice(0, 24)}…</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleClearESP(principalStr)}
                    disabled={clearESPFlag.isPending}
                    className="h-7 text-xs"
                  >
                    {clearESPFlag.isPending ? <Loader2 size={11} className="animate-spin mr-1" /> : null}
                    Clear Flag
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Tabs defaultValue="users">
        <TabsList className="flex flex-wrap h-auto gap-1 w-full justify-start bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="users" className="text-xs">All Users</TabsTrigger>
          <TabsTrigger value="alerts" className="text-xs relative">
            Alerts
            {emotionalAlertCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold rounded-full bg-amber-500 text-white">
                {emotionalAlertCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="flagged" className="text-xs">Flagged</TabsTrigger>
          <TabsTrigger value="comments" className="text-xs">Comments</TabsTrigger>
          <TabsTrigger value="codes" className="text-xs">Invites</TabsTrigger>
          <TabsTrigger value="posts" className="text-xs">Posts</TabsTrigger>
          <TabsTrigger value="members" className="text-xs">Members</TabsTrigger>
          <TabsTrigger value="history" className="text-xs">History</TabsTrigger>
          <TabsTrigger value="signup" className="text-xs">Signup</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <AdminAllUsersTab />
        </TabsContent>

        <TabsContent value="alerts" className="mt-4">
          <AdminEmotionalAlertsTab />
        </TabsContent>

        <TabsContent value="flagged" className="mt-4">
          <AdminFlaggedPosts />
        </TabsContent>

        <TabsContent value="comments" className="mt-4">
          <AdminFlaggedComments />
        </TabsContent>

        <TabsContent value="codes" className="mt-4">
          <AdminInviteCodes />
        </TabsContent>

        <TabsContent value="posts" className="mt-4">
          <AdminPublicPostsList />
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <AdminUserManagement />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <AdminUserPostHistory />
        </TabsContent>

        <TabsContent value="signup" className="mt-4">
          <AdminSignup />
        </TabsContent>
      </Tabs>
    </div>
  );
}
