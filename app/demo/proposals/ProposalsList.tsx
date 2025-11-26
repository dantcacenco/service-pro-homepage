'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Plus, Send, Eye, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ProposalListProps {
  initialProposals: any[];
}

export default function ProposalsList({ initialProposals }: ProposalListProps) {
  const router = useRouter();
  const [proposals, setProposals] = useState(initialProposals);
  const [deleting, setDeleting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel('proposals_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'proposals' }, () => {
        fetchProposals();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProposals = async () => {
    const { data, error } = await supabase
      .from('proposals')
      .select(`
        *,
        customers!inner (
          id,
          name,
          email,
          phone
        )
      `)
      .order('updated_at', { ascending: false });

    if (data) {
      setProposals(data);
    }
  };

  const handleDeleteAll = async () => {
    setDeleting(true);
    try {
      // Call the API endpoint to delete all proposals
      const response = await fetch('/api/proposals/delete-all', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete proposals');
      }
      
      toast.success(result.message || 'All proposals deleted successfully');
      setProposals([]);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete proposals');
      console.error('Delete error:', error);
    } finally {
      setDeleting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'viewed': return 'bg-purple-100 text-purple-800';
      case 'approved':
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'paid': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleSendProposal = async (proposalId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/proposals/${proposalId}`);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Proposals</h1>
          <p className="text-gray-600">Manage your service proposals</p>
        </div>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={deleting || proposals.length === 0}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete all {proposals.length} proposals.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAll}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete All Proposals
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Link href="/proposals/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Proposal
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Proposal #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {proposals.map((proposal) => (
              <TableRow key={proposal.id}>
                <TableCell>
                  <Link 
                    href={`/proposals/${proposal.id}`} 
                    className="font-medium hover:underline text-blue-600"
                  >
                    {proposal.proposal_number}
                  </Link>
                </TableCell>
                <TableCell>{proposal.customers?.name || 'No customer'}</TableCell>
                <TableCell>{formatCurrency(proposal.total || 0)}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(proposal.status)}>
                    {proposal.status}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(proposal.updated_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
