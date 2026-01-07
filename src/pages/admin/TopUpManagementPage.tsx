import React, { useState } from 'react';
import { Play, Eye, Save, Search, X, Calendar as CalendarIcon, Upload, TrendingUp, DollarSign, Users, Clock } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { toast } from '@/hooks/use-toast';
import { useDataStore } from '@/hooks/useDataStore';
import { 
  getEducationAccounts, 
  getBatches,
  getTransactions,
  getAccountHolder, 
  addTransaction, 
  updateEducationAccount,
  addBatch,
  addAuditLog,
  getEducationAccount
} from '@/lib/dataStore';
import { formatCurrency, formatDateTime } from '@/lib/data';
import { cn } from '@/lib/utils';
import { format, startOfWeek, startOfMonth, startOfQuarter, startOfYear } from 'date-fns';

interface BatchPreset {
  id: string;
  name: string;
  minAge: string;
  maxAge: string;
  minBalance: string;
  maxBalance: string;
  schoolingStatus: string;
  amount: string;
  amountType: 'even' | 'per_account';
}

const TopUpManagementPage: React.FC = () => {
  const educationAccounts = useDataStore(getEducationAccounts);
  const batches = useDataStore(getBatches);
  const transactions = useDataStore(getTransactions);
  
  const [individualDialogOpen, setIndividualDialogOpen] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [savePresetDialogOpen, setSavePresetDialogOpen] = useState(false);
  
  // Individual top-up states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [scheduleTopUp, setScheduleTopUp] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  
  // Batch top-up states
  const [batchAmount, setBatchAmount] = useState('');
  const [batchAmountType, setBatchAmountType] = useState<'even' | 'per_account'>('per_account');
  const [minAge, setMinAge] = useState('');
  const [maxAge, setMaxAge] = useState('');
  const [minBalance, setMinBalance] = useState('');
  const [maxBalance, setMaxBalance] = useState('');
  const [schoolingStatus, setSchoolingStatus] = useState<string>('all');
  const [batchScheduleTopUp, setBatchScheduleTopUp] = useState(false);
  const [batchScheduledDate, setBatchScheduledDate] = useState<Date | undefined>();
  const [showPreview, setShowPreview] = useState(false);
  
  // Presets
  const [presets, setPresets] = useState<BatchPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [presetName, setPresetName] = useState('');
  
  // Success result
  const [successResult, setSuccessResult] = useState<{
    type: 'individual' | 'batch';
    count: number;
    total: number;
    scheduled?: boolean;
  } | null>(null);

  // Calculate top-up statistics
  const now = new Date();
  const topUpTransactions = transactions.filter(t => t.type === 'top_up' && t.status === 'completed');
  
  const todayStr = now.toISOString().split('T')[0];
  const todayTopUps = topUpTransactions.filter(t => t.createdAt.startsWith(todayStr));
  const todayTotal = todayTopUps.reduce((sum, t) => sum + t.amount, 0);
  
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekTopUps = topUpTransactions.filter(t => new Date(t.createdAt) >= weekStart);
  const weekTotal = weekTopUps.reduce((sum, t) => sum + t.amount, 0);
  
  const monthStart = startOfMonth(now);
  const monthTopUps = topUpTransactions.filter(t => new Date(t.createdAt) >= monthStart);
  const monthTotal = monthTopUps.reduce((sum, t) => sum + t.amount, 0);
  
  const quarterStart = startOfQuarter(now);
  const quarterTopUps = topUpTransactions.filter(t => new Date(t.createdAt) >= quarterStart);
  const quarterTotal = quarterTopUps.reduce((sum, t) => sum + t.amount, 0);
  
  const yearStart = startOfYear(now);
  const yearTopUps = topUpTransactions.filter(t => new Date(t.createdAt) >= yearStart);
  const yearTotal = yearTopUps.reduce((sum, t) => sum + t.amount, 0);

  const filteredAccounts = educationAccounts.filter(account => {
    const holder = getAccountHolder(account.holderId);
    if (!holder) return false;
    const matchesSearch = 
      holder.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      holder.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && account.status === 'active';
  });

  const getEligibleAccounts = () => {
    return educationAccounts.filter(account => {
      if (account.status !== 'active') return false;
      
      const holder = getAccountHolder(account.holderId);
      if (!holder) return false;

      if (minAge && holder.age < parseInt(minAge)) return false;
      if (maxAge && holder.age > parseInt(maxAge)) return false;
      if (minBalance && account.balance < parseFloat(minBalance)) return false;
      if (maxBalance && account.balance > parseFloat(maxBalance)) return false;
      if (schoolingStatus !== 'all' && holder.schoolingStatus !== schoolingStatus) return false;

      return true;
    });
  };

  const handleSelectAccount = (accountId: string, checked: boolean) => {
    if (checked) {
      setSelectedAccountIds([...selectedAccountIds, accountId]);
    } else {
      setSelectedAccountIds(selectedAccountIds.filter(id => id !== accountId));
    }
  };

  const handleIndividualTopUp = () => {
    if (selectedAccountIds.length === 0 || !amount || !reason) {
      toast({
        title: "Validation Error",
        description: "Please select accounts and fill in all required fields.",
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

    if (scheduleTopUp && !scheduledDate) {
      toast({
        title: "Validation Error",
        description: "Please select a scheduled date.",
        variant: "destructive",
      });
      return;
    }

    // Process each account
    selectedAccountIds.forEach(accountId => {
      const account = getEducationAccount(accountId);
      if (!account) return;

      const newBalance = account.balance + amountNum;
      const transactionId = `TXN${String(Date.now()).slice(-6)}${accountId}`;

      addTransaction({
        id: transactionId,
        accountId: accountId,
        type: 'top_up',
        amount: amountNum,
        balanceAfter: newBalance,
        description: reason,
        reference: `INDIV-${transactionId}`,
        status: scheduleTopUp ? 'pending' : 'completed',
        createdAt: new Date().toISOString(),
      });

      if (!scheduleTopUp) {
        updateEducationAccount(accountId, {
          balance: newBalance,
          lastTopUpDate: new Date().toISOString().split('T')[0],
        });
      }
    });

    addAuditLog({
      id: `AUD${String(Date.now()).slice(-6)}`,
      action: scheduleTopUp ? 'Scheduled Top-up' : 'Individual Top-up',
      entityType: 'Transaction',
      entityId: 'Multiple',
      userId: 'USR001',
      userName: 'Admin User',
      details: `Individual top-up of ${formatCurrency(amountNum)} for ${selectedAccountIds.length} account(s)${scheduleTopUp ? ` scheduled for ${format(scheduledDate!, 'PPP')}` : ''}`,
      createdAt: new Date().toISOString(),
    });

    setSuccessResult({
      type: 'individual',
      count: selectedAccountIds.length,
      total: amountNum * selectedAccountIds.length,
      scheduled: scheduleTopUp,
    });
    setIndividualDialogOpen(false);
    setSuccessDialogOpen(true);
    resetIndividualForm();
  };

  const handleBatchTopUp = () => {
    if (!batchAmount) {
      toast({
        title: "Validation Error",
        description: "Please enter an amount.",
        variant: "destructive",
      });
      return;
    }

    if (batchScheduleTopUp && !batchScheduledDate) {
      toast({
        title: "Validation Error",
        description: "Please select a scheduled date.",
        variant: "destructive",
      });
      return;
    }

    const eligibleAccounts = getEligibleAccounts();
    if (eligibleAccounts.length === 0) {
      toast({
        title: "No Eligible Accounts",
        description: "No accounts match the selected criteria.",
        variant: "destructive",
      });
      return;
    }

    const amountNum = parseFloat(batchAmount);
    const amountPerAccount = batchAmountType === 'even' 
      ? amountNum / eligibleAccounts.length 
      : amountNum;
    const totalAmount = batchAmountType === 'even' 
      ? amountNum 
      : amountNum * eligibleAccounts.length;

    const batchId = `BAT${String(Date.now()).slice(-6)}`;
    addBatch({
      id: batchId,
      type: 'top_up',
      description: `Batch Top-up - ${eligibleAccounts.length} accounts`,
      totalAmount,
      accountCount: eligibleAccounts.length,
      status: batchScheduleTopUp ? 'pending' : 'completed',
      createdAt: new Date().toISOString(),
      createdBy: 'Admin User',
    });

    if (!batchScheduleTopUp) {
      eligibleAccounts.forEach(account => {
        const newBalance = account.balance + amountPerAccount;
        const transactionId = `TXN${String(Date.now()).slice(-6)}${account.id}`;

        addTransaction({
          id: transactionId,
          accountId: account.id,
          type: 'top_up',
          amount: amountPerAccount,
          balanceAfter: newBalance,
          description: `Batch Top-up`,
          reference: `${batchId}-${account.id}`,
          status: 'completed',
          createdAt: new Date().toISOString(),
        });

        updateEducationAccount(account.id, {
          balance: newBalance,
          lastTopUpDate: new Date().toISOString().split('T')[0],
        });
      });
    }

    addAuditLog({
      id: `AUD${String(Date.now()).slice(-6)}`,
      action: batchScheduleTopUp ? 'Scheduled Batch Top-up' : 'Batch Top-up',
      entityType: 'Batch',
      entityId: batchId,
      userId: 'USR001',
      userName: 'Admin User',
      details: `Batch top-up - ${eligibleAccounts.length} accounts, ${formatCurrency(totalAmount)}${batchScheduleTopUp ? ` scheduled for ${format(batchScheduledDate!, 'PPP')}` : ''}`,
      createdAt: new Date().toISOString(),
    });

    setSuccessResult({
      type: 'batch',
      count: eligibleAccounts.length,
      total: totalAmount,
      scheduled: batchScheduleTopUp,
    });
    setBatchDialogOpen(false);
    setSuccessDialogOpen(true);
  };

  const handleSavePreset = () => {
    if (!presetName) {
      toast({
        title: "Validation Error",
        description: "Please enter a preset name.",
        variant: "destructive",
      });
      return;
    }

    const newPreset: BatchPreset = {
      id: `PRESET${String(Date.now()).slice(-6)}`,
      name: presetName,
      minAge,
      maxAge,
      minBalance,
      maxBalance,
      schoolingStatus,
      amount: batchAmount,
      amountType: batchAmountType,
    };

    setPresets([...presets, newPreset]);
    setSavePresetDialogOpen(false);
    setPresetName('');
    
    toast({
      title: "Preset Saved",
      description: `Preset "${presetName}" has been saved.`,
    });
  };

  const loadPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      setMinAge(preset.minAge);
      setMaxAge(preset.maxAge);
      setMinBalance(preset.minBalance);
      setMaxBalance(preset.maxBalance);
      setSchoolingStatus(preset.schoolingStatus);
      setBatchAmount(preset.amount);
      setBatchAmountType(preset.amountType);
    }
  };

  const resetIndividualForm = () => {
    setSearchQuery('');
    setSelectedAccountIds([]);
    setAmount('');
    setReason('');
    setScheduleTopUp(false);
    setScheduledDate(undefined);
  };

  const resetBatchForm = () => {
    setBatchAmount('');
    setBatchAmountType('per_account');
    setMinAge('');
    setMaxAge('');
    setMinBalance('');
    setMaxBalance('');
    setSchoolingStatus('all');
    setBatchScheduleTopUp(false);
    setBatchScheduledDate(undefined);
    setShowPreview(false);
  };

  const eligibleAccounts = getEligibleAccounts();
  const topUpBatches = batches.filter(b => b.type === 'top_up');

  return (
    <AdminLayout>
      <PageHeader 
        title="Top-up Management" 
        description="Manage individual and batch top-ups"
      />

      {/* Mini Dashboard - Top-up Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
        <StatCard
          title="Today"
          value={formatCurrency(todayTotal)}
          subtitle={`${todayTopUps.length} top-ups`}
          icon={<DollarSign className="h-5 w-5" />}
          variant="primary"
        />
        <StatCard
          title="This Week"
          value={formatCurrency(weekTotal)}
          subtitle={`${weekTopUps.length} top-ups`}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="info"
        />
        <StatCard
          title="This Month"
          value={formatCurrency(monthTotal)}
          subtitle={`${monthTopUps.length} top-ups`}
          icon={<Calendar className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          title="This Quarter"
          value={formatCurrency(quarterTotal)}
          subtitle={`${quarterTopUps.length} top-ups`}
          icon={<Clock className="h-5 w-5" />}
          variant="warning"
        />
        <StatCard
          title="This Year"
          value={formatCurrency(yearTotal)}
          subtitle={`${yearTopUps.length} top-ups`}
          icon={<Users className="h-5 w-5" />}
          variant="primary"
        />
      </div>

      {/* Action Buttons */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary/50"
          onClick={() => {
            resetIndividualForm();
            setIndividualDialogOpen(true);
          }}
        >
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                <Search className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Individual Top-up</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Top up one or more specific accounts
              </p>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary/50"
          onClick={() => {
            resetBatchForm();
            setBatchDialogOpen(true);
          }}
        >
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-info/10 mb-4">
                <Upload className="h-7 w-7 text-info" />
              </div>
              <h3 className="text-lg font-semibold">Batch Top-up</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Top up multiple accounts based on rules
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Batches */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Top-up History</CardTitle>
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
              {topUpBatches.slice(0, 10).map(batch => (
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

      {/* Individual Top-up Dialog */}
      <Dialog open={individualDialogOpen} onOpenChange={setIndividualDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Individual Top-up</DialogTitle>
            <DialogDescription>
              Select one or more accounts to top up
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Account Search */}
            <div className="space-y-2">
              <Label>Search Accounts</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or account ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Selected Accounts */}
            {selectedAccountIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedAccountIds.map(id => {
                  const account = educationAccounts.find(a => a.id === id);
                  const holder = account ? getAccountHolder(account.holderId) : null;
                  return (
                    <Badge key={id} variant="secondary" className="pl-2 pr-1 py-1">
                      {holder ? `${holder.firstName} ${holder.lastName}` : id}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 ml-1 hover:bg-transparent"
                        onClick={() => handleSelectAccount(id, false)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  );
                })}
              </div>
            )}

            {/* Account List */}
            {searchQuery && (
              <div className="border rounded-lg max-h-40 overflow-y-auto">
                {filteredAccounts.slice(0, 10).map(account => {
                  const holder = getAccountHolder(account.holderId);
                  const isSelected = selectedAccountIds.includes(account.id);
                  
                  return (
                    <div
                      key={account.id}
                      className={cn(
                        "flex items-center justify-between p-3 cursor-pointer hover:bg-secondary/50",
                        isSelected && "bg-primary/10"
                      )}
                      onClick={() => handleSelectAccount(account.id, !isSelected)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox checked={isSelected} />
                        <div>
                          <p className="font-medium">{holder?.firstName} {holder?.lastName}</p>
                          <p className="text-sm text-muted-foreground">{account.id}</p>
                        </div>
                      </div>
                      <span className="text-sm">{formatCurrency(account.balance)}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Amount and Reason */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (SGD) *</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Reason *</Label>
                <Input
                  placeholder="e.g., Annual Grant"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
            </div>

            {/* Schedule Top-up */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="schedule"
                  checked={scheduleTopUp}
                  onCheckedChange={(checked) => setScheduleTopUp(checked as boolean)}
                />
                <Label htmlFor="schedule">Schedule Top-up</Label>
              </div>
              
              {scheduleTopUp && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !scheduledDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {scheduledDate ? format(scheduledDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={setScheduledDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIndividualDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleIndividualTopUp}>
              <Play className="h-4 w-4 mr-2" />
              {scheduleTopUp ? 'Schedule' : 'Execute'} Top-up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Top-up Dialog */}
      <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Batch Top-up</DialogTitle>
            <DialogDescription>
              Configure rules to top up multiple accounts at once
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Presets */}
            {presets.length > 0 && (
              <div className="space-y-2">
                <Label>Load Preset</Label>
                <Select value={selectedPreset} onValueChange={(value) => {
                  setSelectedPreset(value);
                  loadPreset(value);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a saved preset" />
                  </SelectTrigger>
                  <SelectContent>
                    {presets.map(preset => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {preset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Rules */}
            <div className="space-y-4">
              <h4 className="font-medium">Filter Rules</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Age</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 16"
                    value={minAge}
                    onChange={(e) => setMinAge(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Age</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 29"
                    value={maxAge}
                    onChange={(e) => setMaxAge(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Balance (SGD)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 0"
                    value={minBalance}
                    onChange={(e) => setMinBalance(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Balance (SGD)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 500"
                    value={maxBalance}
                    onChange={(e) => setMaxBalance(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Schooling Status</Label>
                <Select value={schoolingStatus} onValueChange={setSchoolingStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="in_school">In School</SelectItem>
                    <SelectItem value="graduated">Graduated</SelectItem>
                    <SelectItem value="deferred">Deferred</SelectItem>
                    <SelectItem value="dropped_out">Dropped Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Amount Configuration */}
            <div className="space-y-4">
              <h4 className="font-medium">Amount Configuration</h4>
              
              <div className="flex items-end gap-4">
                <div className="flex-1 space-y-2">
                  <Label>Amount (SGD) *</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={batchAmount}
                    onChange={(e) => setBatchAmount(e.target.value)}
                  />
                </div>
                <RadioGroup 
                  value={batchAmountType} 
                  onValueChange={(v) => setBatchAmountType(v as 'even' | 'per_account')}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="per_account" id="per_account" />
                    <Label htmlFor="per_account">Per Account</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="even" id="even" />
                    <Label htmlFor="even">Distribute Evenly</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* Schedule */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="batchSchedule"
                  checked={batchScheduleTopUp}
                  onCheckedChange={(checked) => setBatchScheduleTopUp(checked as boolean)}
                />
                <Label htmlFor="batchSchedule">Schedule Top-up</Label>
              </div>
              
              {batchScheduleTopUp && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !batchScheduledDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {batchScheduledDate ? format(batchScheduledDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={batchScheduledDate}
                      onSelect={setBatchScheduledDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {/* Preview */}
            <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
              <Eye className="h-4 w-4 mr-2" />
              {showPreview ? 'Hide' : 'Show'} Preview ({eligibleAccounts.length} accounts)
            </Button>

            {showPreview && eligibleAccounts.length > 0 && (
              <div className="border rounded-lg max-h-40 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Current Balance</TableHead>
                      <TableHead className="text-right">Top-up Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eligibleAccounts.slice(0, 10).map(account => {
                      const holder = getAccountHolder(account.holderId);
                      const topUpAmount = batchAmountType === 'even' 
                        ? parseFloat(batchAmount || '0') / eligibleAccounts.length 
                        : parseFloat(batchAmount || '0');
                      
                      return (
                        <TableRow key={account.id}>
                          <TableCell>{holder?.firstName} {holder?.lastName}</TableCell>
                          <TableCell>{formatCurrency(account.balance)}</TableCell>
                          <TableCell className="text-right text-success">+{formatCurrency(topUpAmount)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setSavePresetDialogOpen(true)}>
              <Save className="h-4 w-4 mr-2" />
              Save Preset
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setBatchDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleBatchTopUp}>
                <Play className="h-4 w-4 mr-2" />
                {batchScheduleTopUp ? 'Schedule' : 'Execute'} Batch Top-up
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Preset Dialog */}
      <Dialog open={savePresetDialogOpen} onOpenChange={setSavePresetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Save Preset</DialogTitle>
            <DialogDescription>
              Save these batch top-up settings for future use
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Preset Name *</Label>
              <Input
                placeholder="e.g., Youth Education Grant"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSavePresetDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePreset}>
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-success">
              <Play className="h-5 w-5" />
              {successResult?.scheduled ? 'Top-up Scheduled' : 'Top-up Successful'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-6 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mb-4">
              <TrendingUp className="h-8 w-8 text-success" />
            </div>
            <p className="text-lg font-semibold">
              {formatCurrency(successResult?.total || 0)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {successResult?.scheduled ? 'Scheduled for' : 'Processed for'} {successResult?.count} account(s)
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setSuccessDialogOpen(false)} className="w-full">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default TopUpManagementPage;