import { useNavigate } from '@tanstack/react-router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminPublicPostsList from './AdminPublicPostsList';
import AdminUserManagement from './AdminUserManagement';
import AdminInviteCodes from './AdminInviteCodes';
import AdminUserPostHistory from './AdminUserPostHistory';
import AdminSignup from './AdminSignup';
import AdminFlaggedPosts from './AdminFlaggedPosts';
import { useAdminGetSeatCount, useAdminGetESPFlaggedUsers, useAdminClearESPFlag } from '../hooks/useQueries';
import { ArrowLeft, Users, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data: seatCount, isLoading: seatLoading } = useAdminGetSeatCount();
  const { data: espUsers, isLoading: espLoading } = useAdminGetESPFlaggedUsers();
  const clearESPFlag = useAdminClearESPFlag();

  const seatCountNum = seatCount ? Number(seatCount) : 0;

  const handleClearESP = async (userId: string) => {
    try {
      await clearESPFlag.mutateAsync({ userId });
    } catch {
      // silently handle
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
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
            <span className="text-sm font-semibold text-foreground">{seatCountNum}</span>
            <span className="text-sm text-muted-foreground">/ 100 seats used</span>
            <div className="ml-2 h-2 w-24 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.min((seatCountNum / 100) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

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
              const userId = principal.toString();
              return (
                <div key={userId} className="flex items-center justify-between gap-2 py-1.5 border-t border-border/50">
                  <span className="text-xs font-mono text-muted-foreground">{userId.slice(0, 24)}…</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleClearESP(userId)}
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

      <Tabs defaultValue="posts">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="codes">Invites</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="flagged">Flagged</TabsTrigger>
          <TabsTrigger value="signup">Signup</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-4">
          <AdminPublicPostsList />
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <AdminUserManagement />
        </TabsContent>

        <TabsContent value="codes" className="mt-4">
          <AdminInviteCodes />
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <AdminUserPostHistory />
        </TabsContent>

        <TabsContent value="flagged" className="mt-4">
          <AdminFlaggedPosts />
        </TabsContent>

        <TabsContent value="signup" className="mt-4">
          <AdminSignup />
        </TabsContent>
      </Tabs>
    </div>
  );
}
