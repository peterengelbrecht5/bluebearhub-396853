import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle2, LogOut, Home, Vote as VoteIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link, useLocation } from 'wouter';
import type { Election, Contest, Option } from '@shared/schema';

export default function VoterDashboard() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [showBallotDialog, setShowBallotDialog] = useState(false);
  const [voteConfirmation, setVoteConfirmation] = useState(false);

  const { data: elections } = useQuery<Election[]>({
    queryKey: ['/api/elections'],
  });

  const { data: contests } = useQuery<Contest[]>({
    queryKey: ['/api/elections', selectedElection?.id, 'contests'],
    enabled: !!selectedElection,
  });

  const { data: options } = useQuery<Option[]>({
    queryKey: ['/api/contests', selectedContest?.id, 'options'],
    enabled: !!selectedContest,
  });

  const castVoteMutation = useMutation({
    mutationFn: async (data: { contestId: string; optionIds: string[] }) => {
      return await apiRequest('/api/votes', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      toast({ title: 'Vote cast successfully!' });
      setVoteConfirmation(true);
      setTimeout(() => {
        setVoteConfirmation(false);
        setShowBallotDialog(false);
        setSelectedContest(null);
        setSelectedOptions({});
      }, 2000);
    },
    onError: (error: any) => {
      toast({ 
        title: 'Failed to cast vote',
        description: error.message || 'You may have already voted in this contest',
        variant: 'destructive'
      });
    },
  });

  const handleLogout = async () => {
    await logout();
    setLocation('/login');
  };

  const handleVoteInContest = (contest: Contest) => {
    setSelectedContest(contest);
    setShowBallotDialog(true);
    setVoteConfirmation(false);
  };

  const handleSubmitVote = () => {
    if (!selectedContest) return;
    
    const selectedOption = selectedOptions[selectedContest.id];
    if (!selectedOption) {
      toast({ 
        title: 'Please select an option',
        variant: 'destructive'
      });
      return;
    }

    castVoteMutation.mutate({
      contestId: selectedContest.id,
      optionIds: [selectedOption],
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-serif font-bold text-foreground">Blue Ballot</h1>
              {user.name && (
                <span className="text-sm text-muted-foreground">Welcome, {user.name}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="ghost" size="icon" data-testid="button-home">
                  <Home className="h-5 w-5" />
                </Button>
              </Link>
              {user.role === 'admin' && (
                <Link href="/admin">
                  <Button variant="outline" size="sm" data-testid="button-admin">
                    Admin Dashboard
                  </Button>
                </Link>
              )}
              <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="button-logout">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-8">
        <div>
          <h2 className="text-3xl font-serif font-bold text-foreground">Your Elections</h2>
          <p className="text-muted-foreground">View and participate in elections you're eligible for</p>
        </div>

        {elections && elections.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <VoteIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Elections Available</h3>
              <p className="text-muted-foreground">
                You don't have any elections assigned to you yet.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-6">
          {elections?.map((election) => (
            <Card 
              key={election.id} 
              className={selectedElection?.id === election.id ? 'border-primary' : ''}
              data-testid={`card-election-${election.id}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{election.title}</CardTitle>
                    <CardDescription className="mt-2">{election.description}</CardDescription>
                  </div>
                  <span className={`px-3 py-1 rounded-md text-xs font-medium ${
                    election.status === 'open' ? 'bg-accent text-accent-foreground' :
                    election.status === 'scheduled' ? 'bg-secondary text-secondary-foreground' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {election.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    Start: {new Date(election.startAt).toLocaleString()}
                  </span>
                  <span>•</span>
                  <span>
                    End: {new Date(election.endAt).toLocaleString()}
                  </span>
                </div>

                {selectedElection?.id !== election.id ? (
                  <Button 
                    onClick={() => setSelectedElection(election)}
                    variant="outline"
                    className="w-full"
                    data-testid={`button-view-election-${election.id}`}
                  >
                    View Contests
                  </Button>
                ) : (
                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="font-semibold">Contests</h4>
                    {contests?.map((contest) => (
                      <Card key={contest.id} data-testid={`card-contest-${contest.id}`}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">{contest.title}</CardTitle>
                          {contest.description && (
                            <CardDescription>{contest.description}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <Button 
                            onClick={() => handleVoteInContest(contest)}
                            size="sm"
                            disabled={election.status !== 'open'}
                            data-testid={`button-vote-contest-${contest.id}`}
                          >
                            <VoteIcon className="h-4 w-4 mr-2" />
                            Cast Vote
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                    {contests?.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        No contests available yet
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </main>

      <Dialog open={showBallotDialog} onOpenChange={setShowBallotDialog}>
        <DialogContent>
          {voteConfirmation ? (
            <div className="py-8 text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 mx-auto text-accent" />
              <div>
                <DialogTitle className="text-2xl mb-2">Vote Cast Successfully!</DialogTitle>
                <DialogDescription>
                  Your vote has been recorded securely.
                </DialogDescription>
              </div>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{selectedContest?.title}</DialogTitle>
                <DialogDescription>
                  {selectedContest?.description || 'Select your choice below'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <RadioGroup
                  value={selectedOptions[selectedContest?.id || ''] || ''}
                  onValueChange={(value) => {
                    if (selectedContest) {
                      setSelectedOptions({ ...selectedOptions, [selectedContest.id]: value });
                    }
                  }}
                  data-testid="radio-group-options"
                >
                  {options?.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={option.id} id={option.id} data-testid={`radio-option-${option.id}`} />
                      <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                        <div>
                          <div className="font-medium">{option.label}</div>
                          {option.description && (
                            <div className="text-sm text-muted-foreground">{option.description}</div>
                          )}
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                <div className="flex gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowBallotDialog(false)}
                    className="flex-1"
                    data-testid="button-cancel-vote"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmitVote}
                    className="flex-1"
                    disabled={castVoteMutation.isPending}
                    data-testid="button-submit-vote"
                  >
                    {castVoteMutation.isPending ? 'Submitting...' : 'Submit Vote'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
