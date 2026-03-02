import React from 'react';
import { Link } from '@tanstack/react-router';
import { useGetMyPosts, useGetCallerUserProfile } from '../hooks/useQueries';
import { useAuth } from '../hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import EmotionBadge from '../components/EmotionBadge';
import { PenLine, FileText, Users, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const { userId } = useAuth();
  const { data: profile, isLoading: profileLoading } = useGetCallerUserProfile();
  const { data: posts, isLoading: postsLoading } = useGetMyPosts();

  // suppress unused warning
  void userId;

  const recentPosts = posts?.slice(0, 3) ?? [];

  return (
    <main className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      {/* Welcome */}
      <div className="space-y-1">
        {profileLoading ? (
          <Skeleton className="h-8 w-48" />
        ) : (
          <h1 className="text-2xl font-serif font-semibold text-foreground">
            Welcome back{profile?.pseudonym ? `, ${profile.pseudonym}` : ''}
          </h1>
        )}
        <p className="text-sm text-muted-foreground">Your private space for honest expression.</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link to="/create">
          <div className="rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors p-5 space-y-2 cursor-pointer">
            <PenLine className="h-5 w-5 text-muted-foreground" />
            <p className="font-medium text-foreground">New Entry</p>
            <p className="text-xs text-muted-foreground">Write something today</p>
          </div>
        </Link>
        <Link to="/community">
          <div className="rounded-xl border border-border bg-card hover:bg-muted/40 transition-colors p-5 space-y-2 cursor-pointer">
            <Users className="h-5 w-5 text-muted-foreground" />
            <p className="font-medium text-foreground">Community</p>
            <p className="text-xs text-muted-foreground">Read public entries</p>
          </div>
        </Link>
      </div>

      {/* Recent Posts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-medium text-foreground">Recent Entries</h2>
          <Link to="/posts">
            <Button variant="ghost" size="sm" className="text-xs gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>

        {postsLoading && (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        )}

        {!postsLoading && recentPosts.length === 0 && (
          <div className="text-center py-8 space-y-2">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground">No entries yet. Start writing!</p>
          </div>
        )}

        {!postsLoading && recentPosts.length > 0 && (
          <div className="space-y-3">
            {recentPosts.map((post) => (
              <div
                key={post.id}
                className="rounded-xl border border-border bg-card px-4 py-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <EmotionBadge emotionType={post.emotionType} />
                  <span className="text-xs text-muted-foreground">
                    {new Date(Number(post.createdAt) / 1_000_000).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-foreground line-clamp-2">{post.content}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
