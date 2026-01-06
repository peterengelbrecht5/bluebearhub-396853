import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {

 Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Vote, Users, BarChart3, LogOut, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link, useLocation } from 'wouter';
import type { Election, Contest, Option } from '@shared/schema';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedElection, setSelectedElection] = useState<string | null>(null);
  const [showNewElectionDialog, setShowNewElectionDialog] = useState(false);
  const [showNewContestDialog, setShowNewContestDialog] = useState(false);

  const { data: elections } = useQuery<Election[]>({
    queryKey: ['/api/elections'],
  });

  const { data: contests } = useQuery<Contest[]>({
    queryKey: ['/api/elections', selectedElection, 'contests'],
    enabled: !!selectedElection,
  });

  const { data: users } = useQuery<any[]>({
    queryKey: ['/api/users'],
  });

  const createElectionMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/elections', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/elections'] });
      toast({ title: 'Election created successfully' });
      setShowNewElectionDialog(false);
    },
  });

  const createContestMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest(`/api/elections/${selectedElection}/contests`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/elections', selectedElection, 'contests'] });
      toast({ title: 'Contest created successfully' });
      setShowNewContestDialog(false);
    },
  });

  const handleLogout = async () => {
    await logout();
    setLocation('/login');
  };

  const handleCreateElection = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createElectionMutation.mutate({
      title: formData.get('title'),
      description: formData.get('description'),
      startAt: new Date(formData.get('startAt') as string).toISOString(),
      endAt: new Date(formData.get('endAt') as string).toISOString(),
      status: 'draft',
    });
  };

  const handleCreateContest = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createContestMutation.mutate({
      title: formData.get('title'),
      description: formData.get('description'),
      type: formData.get('type'),
    });
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You need admin access to view this page</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/ballot">
              <Button>Go to Voter Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-serif font-bold text-foreground">Blue Ballot Admin</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="ghost" size="icon" data-testid="button-home">
                  <Home className="h-5 w-5" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-serif font-bold text-foreground">Elections</h2>
            <p className="text-muted-foreground">Manage your elections and contests</p>
          </div>
          <Dialog open={showNewElectionDialog} onOpenChange={setShowNewElectionDialog}>
            <DialogTrigger asChild>
              <Button data-testid="button-new-election">
                <Plus className="h-4 w-4 mr-2" />
                New Election
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Election</DialogTitle>
                <DialogDescription>Set up a new election with contests and voting options</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateElection} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" required data-testid="input-election-title" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" data-testid="input-election-description" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startAt">Start Date</Label>
                    <Input id="startAt" name="startAt" type="datetime-local" required data-testid="input-election-start" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endAt">End Date</Label>
                    <Input id="endAt" name="endAt" type="datetime-local" required data-testid="input-election-end" />
                  </div>
                </div>
                <Button type="submit" className="w-full" data-testid="button-create-election">
                  Create Election
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {elections?.map((election) => (
            <Card 
              key={election.id} 
              className="hover-elevate active-elevate-2 cursor-pointer"
              onClick={() => setSelectedElection(election.id)}
              data-testid={`card-election-${election.id}`}
            >
              <CardHeader>
                <CardTitle className="text-lg">{election.title}</CardTitle>
                <CardDescription>{election.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {new Date(election.startAt).toLocaleDateString()}
                  </span>
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                    election.status === 'open' ? 'bg-accent text-accent-foreground' :
                    election.status === 'draft' ? 'bg-muted text-muted-foreground' :
                    'bg-card text-card-foreground'
                  }`}>
                    {election.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedElection && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Contests</CardTitle>
                  <CardDescription>Manage contests for the selected election</CardDescription>
                </div>
                <Dialog open={showNewContestDialog} onOpenChange={setShowNewContestDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="button-new-contest">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Contest
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Contest</DialogTitle>
                      <DialogDescription>Add a new contest to this election</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateContest} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="contest-title">Title</Label>
                        <Input id="contest-title" name="title" required data-testid="input-contest-title" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contest-description">Description</Label>
                        <Textarea id="contest-description" name="description" data-testid="input-contest-description" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <Select name="type" defaultValue="single-choice" required>
                          <SelectTrigger data-testid="select-contest-type">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="single-choice">Single Choice</SelectItem>
                            <SelectItem value="multi-choice">Multi Choice</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button type="submit" className="w-full" data-testid="button-create-contest">
                        Create Contest
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contests?.map((contest) => (
                  <Card key={contest.id} data-testid={`card-contest-${contest.id}`}>
                    <CardHeader>
                      <CardTitle className="text-base">{contest.title}</CardTitle>
                      <CardDescription>{contest.description}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
                {contests?.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">
                    No contests yet. Add one to get started.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
