import { useNavigate } from '@tanstack/react-router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdminPublicPostsList from './AdminPublicPostsList';
import AdminUserManagement from './AdminUserManagement';
import AdminInviteCodes from './AdminInviteCodes';
import AdminUserPostHistory from './AdminUserPostHistory';
import { ArrowLeft } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();

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

      <Tabs defaultValue="posts">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="posts">Public Posts</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="codes">Invite Codes</TabsTrigger>
          <TabsTrigger value="history">Post History</TabsTrigger>
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
      </Tabs>
    </div>
  );
}
