import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Wallet } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { useDataStore } from '@/hooks/useDataStore';
import { 
  getEducationAccounts, 
  getAccountHolder, 
  addTransaction, 
  updateEducationAccount,
  addAuditLog,
  getEducationAccount
} from '@/lib/dataStore';
import { formatCurrency } from '@/lib/data';

const SingleTopUpPage: React.FC = () => {
  const navigate = useNavigate();
  const educationAccounts = useDataStore(getEducationAccounts);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [scheme, setScheme] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');
  const [reference, setReference] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAccounts = educationAccounts.filter(account => {
    const holder = getAccountHolder(account.holderId);
    if (!holder) return false;
    const matchesSearch = 
      holder.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      holder.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && account.status === 'active';
  });

  const selectedAccount = selectedAccountId ? getEducationAccount(selectedAccountId) : null;
  const selectedHolder = selectedAccount ? getAccountHolder(selectedAccount.holderId) : null;

  const handleTopUp = () => {
    if (!selectedAccountId || !amount || !scheme || !reason) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid positive amount.",
        variant: "destructive",
      });
      return;
    }

    const account = getEducationAccount(selectedAccountId);
    if (!account) return;

    const newBalance = account.balance + amountNum;
    const transactionId = `TXN${String(Date.now()).slice(-6)}`;

    // Add transaction
    addTransaction({
      id: transactionId,
      accountId: selectedAccountId,
      type: 'top_up',
      amount: amountNum,
      balanceAfter: newBalance,
      description: `${scheme} - ${reason}`,
      reference: reference || `REF-${transactionId}`,
      status: 'completed',
      createdAt: new Date().toISOString(),
    });

    // Update account balance
    updateEducationAccount(selectedAccountId, {
      balance: newBalance,
      lastTopUpDate: effectiveDate,
    });

    // Add audit log
    addAuditLog({
      id: `AUD${String(Date.now()).slice(-6)}`,
      action: 'Manual Top-up',
      entityType: 'Transaction',
      entityId: transactionId,
      userId: 'USR001',
      userName: 'Admin User',
      details: `Manual top-up of ${formatCurrency(amountNum)} for account ${selectedAccountId}`,
      createdAt: new Date().toISOString(),
    });

    toast({
      title: "Top-up Successful",
      description: `${formatCurrency(amountNum)} has been added to account ${selectedAccountId}.`,
    });

    navigate(`/admin/accounts/${selectedAccountId}`);
  };

  return (
    <AdminLayout>
      <PageHeader 
        title="Single Top-up" 
        description="Add funds to a single education account"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Account Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Account</CardTitle>
            <CardDescription>Search and select an education account to top up</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or account ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {filteredAccounts.slice(0, 10).map((account) => {
                const holder = getAccountHolder(account.holderId);
                if (!holder) return null;

                return (
                  <div
                    key={account.id}
                    onClick={() => setSelectedAccountId(account.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedAccountId === account.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{holder.firstName} {holder.lastName}</p>
                        <p className="text-sm text-muted-foreground">{account.id}</p>
                      </div>
                      <p className="font-semibold">{formatCurrency(account.balance)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedAccount && selectedHolder && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Selected Account</h4>
                <p className="text-sm"><strong>Holder:</strong> {selectedHolder.firstName} {selectedHolder.lastName}</p>
                <p className="text-sm"><strong>Account ID:</strong> {selectedAccount.id}</p>
                <p className="text-sm"><strong>Current Balance:</strong> {formatCurrency(selectedAccount.balance)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top-up Details */}
        <Card>
          <CardHeader>
            <CardTitle>Top-up Details</CardTitle>
            <CardDescription>Enter the top-up amount and details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (SGD) *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

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
                  <SelectItem value="Manual Adjustment">Manual Adjustment</SelectItem>
                  <SelectItem value="Refund">Refund</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="effectiveDate">Effective Date</Label>
              <Input
                id="effectiveDate"
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Reason for this top-up..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Reference (Optional)</Label>
              <Input
                id="reference"
                placeholder="External reference number"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>

            <Button 
              onClick={handleTopUp} 
              className="w-full" 
              disabled={!selectedAccountId || !amount || !scheme || !reason}
            >
              <Wallet className="h-4 w-4 mr-2" />
              Process Top-up
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default SingleTopUpPage;
