import React, { useState } from 'react';
import { Play, Eye, Check, X } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { useDataStore } from '@/hooks/useDataStore';
import { 
  getEducationAccounts, 
  getBatches,
  getAccountHolder, 
  addTransaction, 
  updateEducationAccount,
  addBatch,
  addAuditLog,
} from '@/lib/dataStore';
import { formatCurrency, formatDateTime, SchoolingStatus } from '@/lib/data';

const BatchTopUpPage: React.FC = () => {
  const educationAccounts = useDataStore(getEducationAccounts);
  const batches = useDataStore(getBatches);
  
  const [scheme, setScheme] = useState('');
  const [amount, setAmount] = useState('');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [minBalance, setMinBalance] = useState('');
  const [maxBalance, setMaxBalance] = useState('');
  const [schoolingStatus, setSchoolingStatus] = useState<string>('all');
  const [previewAccounts, setPreviewAccounts] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const getEligibleAccounts = () => {
    return educationAccounts.filter(account => {
      if (account.status !== 'active') return false;
      
      const holder = getAccountHolder(account.holderId);
      if (!holder) return false;

      // Age filter
      if (minAge && holder.age < parseInt(minAge)) return false;
      if (maxAge && holder.age > parseInt(maxAge)) return false;

      // Balance filter
      if (minBalance && account.balance < parseFloat(minBalance)) return false;
      if (maxBalance && account.balance > parseFloat(maxBalance)) return false;

      // Schooling status filter
      if (schoolingStatus !== 'all' && holder.schoolingStatus !== schoolingStatus) return false;

      return true;
    });
  };

  const handlePreview = () => {
    if (!scheme || !amount) {
      toast({
        title: "Validation Error",
        description: "Please enter a scheme and amount.",
        variant: "destructive",
      });
      return;
    }

    const eligible = getEligibleAccounts();
    setPreviewAccounts(eligible.map(a => a.id));
    setShowPreview(true);
  };

  const handleExecuteBatch = () => {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive amount.",
        variant: "destructive",
      });
      return;
    }

    const eligibleAccounts = getEligibleAccounts();
    const totalAmount = amountNum * eligibleAccounts.length;

    // Create batch
    const batchId = `BAT${String(Date.now()).slice(-6)}`;
    addBatch({
      id: batchId,
      type: 'top_up',
      description: `${scheme} - Batch Top-up`,
      totalAmount,
      accountCount: eligibleAccounts.length,
      status: 'completed',
      createdAt: new Date().toISOString(),
      createdBy: 'Admin User',
    });

    // Process each account
    eligibleAccounts.forEach(account => {
      const newBalance = account.balance + amountNum;
      const transactionId = `TXN${String(Date.now()).slice(-6)}${account.id}`;

      addTransaction({
        id: transactionId,
        accountId: account.id,
        type: 'top_up',
        amount: amountNum,
        balanceAfter: newBalance,
        description: `${scheme} - Batch Top-up`,
        reference: `${batchId}-${account.id}`,
        status: 'completed',
        createdAt: new Date().toISOString(),
      });

      updateEducationAccount(account.id, {
        balance: newBalance,
        lastTopUpDate: new Date().toISOString().split('T')[0],
      });
    });

    // Add audit log
    addAuditLog({
      id: `AUD${String(Date.now()).slice(-6)}`,
      action: 'Batch Top-up',
      entityType: 'Batch',
      entityId: batchId,
      userId: 'USR001',
      userName: 'Admin User',
      details: `Batch top-up executed - ${eligibleAccounts.length} accounts, ${formatCurrency(totalAmount)}`,
      createdAt: new Date().toISOString(),
    });

    toast({
      title: "Batch Top-up Completed",
      description: `${eligibleAccounts.length} accounts topped up with ${formatCurrency(amountNum)} each. Total: ${formatCurrency(totalAmount)}`,
    });

    // Reset form
    setScheme('');
    setAmount('');
    setMinAge('');
    setMaxAge('');
    setMinBalance('');
    setMaxBalance('');
    setSchoolingStatus('all');
    setShowPreview(false);
    setPreviewAccounts([]);
  };

  const eligibleAccounts = getEligibleAccounts();

  return (
    <AdminLayout>
      <PageHeader 
        title="Batch Top-up" 
        description="Configure and run batch top-ups based on rules"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Configuration */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Batch Configuration</CardTitle>
            <CardDescription>Define the rules for this batch top-up</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="scheme">Scheme *</Label>
                <Select value={scheme} onValueChange={setScheme}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select scheme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Annual Education Subsidy">Annual Education Subsidy</SelectItem>
                    <SelectItem value="Youth Education Grant">Youth Education Grant</SelectItem>
                    <SelectItem value="Quarterly Top-up">Quarterly Top-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount per Account (SGD) *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-4">Filter Criteria</h4>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="minAge">Min Age</Label>
                  <Input
                    id="minAge"
                    type="number"
                    placeholder="e.g., 16"
                    value={minAge}
                    onChange={(e) => setMinAge(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxAge">Max Age</Label>
                  <Input
                    id="maxAge"
                    type="number"
                    placeholder="e.g., 29"
                    value={maxAge}
                    onChange={(e) => setMaxAge(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schoolingStatus">Schooling Status</Label>
                  <Select value={schoolingStatus} onValueChange={setSchoolingStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="in_school">In School</SelectItem>
                      <SelectItem value="graduated">Graduated</SelectItem>
                      <SelectItem value="deferred">Deferred</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minBalance">Min Balance (SGD)</Label>
                  <Input
                    id="minBalance"
                    type="number"
                    placeholder="0.00"
                    value={minBalance}
                    onChange={(e) => setMinBalance(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxBalance">Max Balance (SGD)</Label>
                  <Input
                    id="maxBalance"
                    type="number"
                    placeholder="e.g., 500"
                    value={maxBalance}
                    onChange={(e) => setMaxBalance(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={handlePreview}>
                <Eye className="h-4 w-4 mr-2" />
                Preview ({eligibleAccounts.length} accounts)
              </Button>
              <Button 
                onClick={handleExecuteBatch}
                disabled={!scheme || !amount || eligibleAccounts.length === 0}
              >
                <Play className="h-4 w-4 mr-2" />
                Execute Batch
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-3xl font-bold text-primary">{eligibleAccounts.length}</p>
              <p className="text-sm text-muted-foreground">Eligible Accounts</p>
            </div>
            {amount && (
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-success">
                  {formatCurrency(parseFloat(amount || '0') * eligibleAccounts.length)}
                </p>
                <p className="text-sm text-muted-foreground">Total Amount</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview Table */}
      {showPreview && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Preview: Eligible Accounts</CardTitle>
            <CardDescription>Review the accounts that will receive the top-up</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Account Holder</TableHead>
                  <TableHead>Account ID</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Schooling Status</TableHead>
                  <TableHead className="text-right">Current Balance</TableHead>
                  <TableHead className="text-right">New Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {eligibleAccounts.slice(0, 20).map(account => {
                  const holder = getAccountHolder(account.holderId);
                  if (!holder) return null;
                  const topUpAmount = parseFloat(amount || '0');

                  return (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{holder.firstName} {holder.lastName}</TableCell>
                      <TableCell className="font-mono">{account.id}</TableCell>
                      <TableCell>{holder.age}</TableCell>
                      <TableCell className="capitalize">{holder.schoolingStatus.replace('_', ' ')}</TableCell>
                      <TableCell className="text-right">{formatCurrency(account.balance)}</TableCell>
                      <TableCell className="text-right font-semibold text-success">
                        {formatCurrency(account.balance + topUpAmount)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {eligibleAccounts.length > 20 && (
              <p className="text-sm text-muted-foreground text-center mt-4">
                Showing 20 of {eligibleAccounts.length} accounts
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Batches */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Batches</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch ID</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Accounts</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.filter(b => b.type === 'top_up').slice(0, 5).map(batch => (
                <TableRow key={batch.id}>
                  <TableCell className="font-mono">{batch.id}</TableCell>
                  <TableCell>{batch.description}</TableCell>
                  <TableCell>{batch.accountCount}</TableCell>
                  <TableCell className="text-right">{formatCurrency(batch.totalAmount)}</TableCell>
                  <TableCell>
                    <Badge variant={batch.status === 'completed' ? 'success' : batch.status === 'pending' ? 'warning' : 'destructive'}>
                      {batch.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(batch.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default BatchTopUpPage;
