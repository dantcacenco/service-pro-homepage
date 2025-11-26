'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserCog, Search, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Customer {
  id: string;
  name: string;
  address: string;
  email: string;
}

interface ManualCustomerMatchProps {
  jobId: string;
  currentCustomerId: string;
  currentCustomerName: string;
  jobAddress: string;
}

export default function ManualCustomerMatch({
  jobId,
  currentCustomerId,
  currentCustomerName,
  jobAddress
}: ManualCustomerMatchProps) {
  const router = useRouter();
  const supabase = createClient();

  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isPlaceholder = currentCustomerName === 'N/A';

  useEffect(() => {
    if (open) {
      loadCustomers();
    }
  }, [open]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = customers.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.address?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query)
      );
      setFilteredCustomers(filtered);
    }
  }, [searchQuery, customers]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, address, email')
        .neq('email', 'na-placeholder@placeholder.local') // Exclude placeholder
        .order('name', { ascending: true })
        .limit(500);

      if (error) throw error;

      setCustomers(data || []);
      setFilteredCustomers(data || []);

      // Pre-fill search with job address for convenience
      if (jobAddress) {
        setSearchQuery(jobAddress);
      }
    } catch (error: any) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCustomerId) {
      toast.error('Please select a customer');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}/update-customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: selectedCustomerId })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update customer');
      }

      toast.success(`Customer updated to: ${data.customer.name}`);
      setOpen(false);
      router.refresh(); // Refresh the page to show updated customer
    } catch (error: any) {
      console.error('Error updating customer:', error);
      toast.error(error.message || 'Failed to update customer');
    } finally {
      setSaving(false);
    }
  };

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={isPlaceholder ? 'default' : 'outline'}
          size="sm"
          className={isPlaceholder ? 'bg-orange-600 hover:bg-orange-700' : ''}
        >
          <UserCog className="h-4 w-4 mr-2" />
          {isPlaceholder ? 'Match Customer' : 'Change Customer'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manual Customer Matching</DialogTitle>
          <DialogDescription>
            Select the correct customer for this job. Search by name, address, or email.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Customer Info */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-start gap-3">
              {isPlaceholder && (
                <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-700">Current Customer:</p>
                <p className={`text-base ${isPlaceholder ? 'text-orange-600 font-semibold' : 'text-gray-900'}`}>
                  {currentCustomerName}
                </p>
                {jobAddress && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold text-gray-600">Job Address:</p>
                    <p className="text-sm text-gray-700">{jobAddress}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Customers</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                type="text"
                placeholder="Search by name, address, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <p className="text-xs text-gray-500">
              Found {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Customer Select */}
          <div className="space-y-2">
            <Label htmlFor="customer">Select Customer</Label>
            {loading ? (
              <div className="text-sm text-gray-500">Loading customers...</div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-sm text-gray-500">No customers found</div>
            ) : (
              <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                <SelectTrigger id="customer">
                  <SelectValue placeholder="Choose a customer..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {filteredCustomers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      <div className="flex flex-col items-start py-1">
                        <span className="font-semibold">{customer.name}</span>
                        {customer.address && (
                          <span className="text-xs text-gray-500">{customer.address}</span>
                        )}
                        {customer.email && (
                          <span className="text-xs text-gray-400">{customer.email}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Selected Customer Preview */}
          {selectedCustomer && (
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <p className="text-xs font-semibold text-green-800 mb-1">Selected:</p>
              <p className="text-sm font-semibold text-green-900">{selectedCustomer.name}</p>
              {selectedCustomer.address && (
                <p className="text-xs text-green-700 mt-1">{selectedCustomer.address}</p>
              )}
              {selectedCustomer.email && (
                <p className="text-xs text-green-600 mt-0.5">{selectedCustomer.email}</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!selectedCustomerId || saving}>
            {saving ? 'Saving...' : 'Update Customer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
