import { useState } from 'react';
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
    <div className="max-w-4xl mx-auto px-6 py-12 animate-fade-in">
      {/* Back */}
      <button
        onClick={() => navigate({ to: '/' })}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-sans mb-10"
      >
        <ArrowLeft size={15} />
        Back
      </button>

      <div className="mb-8">
        <h1 className="font-serif text-3xl font-medium text-foreground">
          Moderation
        </h1>
        <p className="mt-2 text-muted-foreground font-sans text-sm">
          Human review only. No automated actions.
        </p>
      </div>

      <Tabs defaultValue="posts" className="space-y-6">
        <TabsList className="bg-muted/60 rounded-xl p-1 h-auto gap-1">
          <TabsTrigger value="posts" className="rounded-lg font-sans text-sm px-4 py-2">
            Public Posts
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-lg font-sans text-sm px-4 py-2">
            Members
          </TabsTrigger>
          <TabsTrigger value="invites" className="rounded-lg font-sans text-sm px-4 py-2">
            Invite Codes
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg font-sans text-sm px-4 py-2">
            Post History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          <AdminPublicPostsList />
        </TabsContent>
        <TabsContent value="users">
          <AdminUserManagement />
        </TabsContent>
        <TabsContent value="invites">
          <AdminInviteCodes />
        </TabsContent>
        <TabsContent value="history">
          <AdminUserPostHistory />
        </TabsContent>
      </Tabs>
    </div>
  );
}
