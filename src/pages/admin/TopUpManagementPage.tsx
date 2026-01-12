import React, { useState } from 'react';
import { Play, Eye, Search, X, Calendar as CalendarIcon, Upload, TrendingUp, DollarSign, Clock, Download, Filter, Users, Hash, BarChart3, Edit, Trash2 } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { formatCurrency, formatDateTime, formatDate } from '@/lib/data';
import { cn } from '@/lib/utils';
import { format, startOfMonth, startOfWeek, startOfQuarter, startOfYear } from 'date-fns';

const TopUpManagementPage: React.FC = () => {
  const educationAccounts = useDataStore(getEducationAccounts);
  const batches = useDataStore(getBatches);
  const transactions = useDataStore(getTransactions);
  
  const [individualDialogOpen, setIndividualDialogOpen] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  
  // Filter states
  const [transactionType, setTransactionType] = useState<'all' | 'individual' | 'batch'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  
  // Pagination states
  const [individualPage, setIndividualPage] = useState(1);
  const [individualPageSize, setIndividualPageSize] = useState(10);
  const [batchPage, setBatchPage] = useState(1);
  const [batchPageSize, setBatchPageSize] = useState(10);
  
  // Individual top-up states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [amount, setAmount] = useState('');
  const [internalDescription, setInternalDescription] = useState('');
  const [externalDescription, setExternalDescription] = useState('');
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
  const [batchInternalDescription, setBatchInternalDescription] = useState('');
  const [batchExternalDescription, setBatchExternalDescription] = useState('');
  
  // Success result
  const [successResult, setSuccessResult] = useState<{
    type: 'individual' | 'batch';
    count: number;
    total: number;
    scheduled?: boolean;
  } | null>(null);

  // Calculate statistics
  const now = new Date();
  const monthStart = startOfMonth(now);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const quarterStart = startOfQuarter(now);
  const yearStart = startOfYear(now);
  
  const topUpTransactions = transactions.filter(t => t.type === 'top_up');
  const completedTopUps = topUpTransactions.filter(t => t.status === 'completed');
  const scheduledTopUps = topUpTransactions.filter(t => t.status === 'pending');
  
  // This month stats
  const monthTopUps = completedTopUps.filter(t => new Date(t.createdAt) >= monthStart);
  const monthTotal = monthTopUps.reduce((sum, t) => sum + t.amount, 0);
  const monthScheduled = scheduledTopUps.filter(t => new Date(t.createdAt) >= monthStart);
  
  // Individual vs Batch breakdown (simulated based on reference pattern)
  const individualTopUps = completedTopUps.filter(t => t.reference?.startsWith('INDIV') || t.reference?.startsWith('MAN'));
  const batchTopUpsTxns = completedTopUps.filter(t => t.reference?.startsWith('BAT') || t.reference?.startsWith('AES') || t.reference?.startsWith('YEG'));
  
  const monthIndividual = individualTopUps.filter(t => new Date(t.createdAt) >= monthStart);
  const monthIndividualTotal = monthIndividual.reduce((sum, t) => sum + t.amount, 0);
  const monthIndividualAccounts = new Set(monthIndividual.map(t => t.accountId)).size;
  
  const monthBatch = batchTopUpsTxns.filter(t => new Date(t.createdAt) >= monthStart);
  const monthBatchTotal = monthBatch.reduce((sum, t) => sum + t.amount, 0);
  const monthBatchAccounts = new Set(monthBatch.map(t => t.accountId)).size;
  
  // Batch records
  const topUpBatches = batches.filter(b => b.type === 'top_up');
  const monthBatches = topUpBatches.filter(b => new Date(b.createdAt) >= monthStart);
  const scheduledBatches = topUpBatches.filter(b => b.status === 'pending');

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

  // Filter transactions for display
  const getFilteredTransactions = (type: 'individual' | 'batch') => {
    let filtered = topUpTransactions;
    
    if (type === 'individual') {
      filtered = filtered.filter(t => t.reference?.startsWith('INDIV') || t.reference?.startsWith('MAN') || !t.reference?.startsWith('BAT'));
    } else {
      filtered = filtered.filter(t => t.reference?.startsWith('BAT') || t.reference?.startsWith('AES') || t.reference?.startsWith('YEG'));
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter);
    }
    
    if (dateFrom) {
      filtered = filtered.filter(t => new Date(t.createdAt) >= dateFrom);
    }
    
    if (dateTo) {
      filtered = filtered.filter(t => new Date(t.createdAt) <= dateTo);
    }
    
    return filtered;
  };

  const handleSelectAccount = (accountId: string, checked: boolean) => {
    if (checked) {
      setSelectedAccountIds([...selectedAccountIds, accountId]);
    } else {
      setSelectedAccountIds(selectedAccountIds.filter(id => id !== accountId));
    }
  };

  const handleViewDetails = (txn: any) => {
    setSelectedTransaction(txn);
    setDetailsDialogOpen(true);
  };

  const handleIndividualTopUp = () => {
    if (selectedAccountIds.length === 0 || !amount || !internalDescription) {
      toast({
        title: "Validation Error",
        description: "Please select accounts and fill in all required fields (amount and internal description).",
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
        description: internalDescription,
        externalDescription: externalDescription || internalDescription,
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

    if (!batchInternalDescription) {
      toast({
        title: "Validation Error",
        description: "Please enter an internal description.",
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
      description: batchInternalDescription,
      externalDescription: batchExternalDescription || batchInternalDescription,
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
          description: batchInternalDescription,
          externalDescription: batchExternalDescription || batchInternalDescription,
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
    resetBatchForm();
  };

  const resetIndividualForm = () => {
    setSearchQuery('');
    setSelectedAccountIds([]);
    setAmount('');
    setInternalDescription('');
    setExternalDescription('');
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
    setBatchInternalDescription('');
    setBatchExternalDescription('');
  };

  const handleExport = (type: string) => {
    toast({
      title: "Export Started",
      description: `Exporting ${type} report as CSV...`,
    });
  };

  const eligibleAccounts = getEligibleAccounts();

  return (
    <AdminLayout>
      <PageHeader 
        title="Top-up Management" 
        description="Manage individual and batch top-ups"
      />

      {/* Mini Dashboard */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Hash className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Top-ups This Month</p>
                <p className="text-xl font-bold">{monthTopUps.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Scheduled This Month</p>
                <p className="text-xl font-bold">{monthScheduled.length + scheduledBatches.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Amount (Month)</p>
                <p className="text-xl font-bold">{formatCurrency(monthTotal)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground font-medium">Individual Top-ups</p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold">{formatCurrency(monthIndividualTotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {monthIndividual.length} times • {monthIndividualAccounts} accounts
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-1">
              <p className="text-xs text-muted-foreground font-medium">Batch Top-ups</p>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold">{formatCurrency(monthBatchTotal)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {monthBatches.length} batches • {monthBatchAccounts} accounts
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
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
              <h3 className="text-lg font-semibold">Ad-hoc Top-up</h3>
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

      {/* Upcoming Top-ups */}
      {(scheduledTopUps.length > 0 || scheduledBatches.length > 0) && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Upcoming Top-ups
            </CardTitle>
            <CardDescription>Scheduled top-ups pending execution</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Accounts</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead>Scheduled Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scheduledBatches.map(batch => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-mono">{batch.id}</TableCell>
                    <TableCell><Badge variant="secondary">Batch</Badge></TableCell>
                    <TableCell>{batch.description}</TableCell>
                    <TableCell>{batch.accountCount}</TableCell>
                    <TableCell className="text-right">{formatCurrency(batch.totalAmount)}</TableCell>
                    <TableCell>{formatDateTime(batch.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant="warning">Scheduled</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(batch)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => {
                          toast({ title: "Delete Scheduled", description: `Scheduled batch ${batch.id} would be deleted.`, variant: "destructive" });
                        }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {scheduledTopUps.slice(0, 5).map(txn => {
                  const account = getEducationAccount(txn.accountId);
                  const holder = account ? getAccountHolder(account.holderId) : null;
                  return (
                    <TableRow key={txn.id}>
                      <TableCell className="font-mono">{txn.id}</TableCell>
                      <TableCell><Badge variant="outline">Individual</Badge></TableCell>
                      <TableCell>{txn.description}</TableCell>
                      <TableCell>{holder ? `${holder.firstName} ${holder.lastName}` : txn.accountId}</TableCell>
                      <TableCell className="text-right">{formatCurrency(txn.amount)}</TableCell>
                      <TableCell>{formatDateTime(txn.createdAt)}</TableCell>
                      <TableCell>
                        <Badge variant="warning">Scheduled</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleViewDetails(txn)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => {
                            toast({ title: "Delete Scheduled", description: `Scheduled top-up ${txn.id} would be deleted.`, variant: "destructive" });
                          }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Top-up Transactions - Tabbed */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Top-up Transactions</CardTitle>
            <CardDescription>View and filter all top-up records</CardDescription>
          </div>
          <Button variant="outline" onClick={() => handleExport('top-up')}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Label className="text-sm">From:</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-[130px] justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "PP") : "Start"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={setDateFrom}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm">To:</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-[130px] justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "PP") : "End"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={setDateTo}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Scheduled</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            {(dateFrom || dateTo || statusFilter !== 'all') && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setDateFrom(undefined);
                  setDateTo(undefined);
                  setStatusFilter('all');
                }}
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          <Tabs defaultValue="adhoc" className="space-y-4">
            <TabsList>
              <TabsTrigger value="adhoc">Ad-hoc Top-ups</TabsTrigger>
              <TabsTrigger value="batch">Batch Top-ups</TabsTrigger>
            </TabsList>

            <TabsContent value="adhoc">
              {(() => {
                const allIndividual = getFilteredTransactions('individual').sort((a, b) => 
                  new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
                const totalPages = Math.ceil(allIndividual.length / individualPageSize);
                const paginatedData = allIndividual.slice((individualPage - 1) * individualPageSize, individualPage * individualPageSize);
                return (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Transaction ID</TableHead>
                          <TableHead>Account</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedData.map(txn => {
                          const account = getEducationAccount(txn.accountId);
                          const holder = account ? getAccountHolder(account.holderId) : null;

                          return (
                            <TableRow key={txn.id}>
                              <TableCell>{formatDateTime(txn.createdAt)}</TableCell>
                              <TableCell className="font-mono text-sm">{txn.id}</TableCell>
                              <TableCell>
                                {holder ? `${holder.firstName} ${holder.lastName}` : txn.accountId}
                              </TableCell>
                              <TableCell>{txn.description}</TableCell>
                              <TableCell className="text-right font-semibold text-success">
                                +{formatCurrency(txn.amount)}
                              </TableCell>
                              <TableCell>
                                <Badge variant={txn.status === 'completed' ? 'success' : txn.status === 'pending' ? 'warning' : 'destructive'}>
                                  {txn.status === 'pending' ? 'Scheduled' : txn.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" onClick={() => handleViewDetails(txn)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Rows per page:</span>
                        <Select value={individualPageSize.toString()} onValueChange={(v) => { setIndividualPageSize(Number(v)); setIndividualPage(1); }}>
                          <SelectTrigger className="w-[70px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="30">30</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Page {individualPage} of {totalPages || 1} ({allIndividual.length} records)
                        </span>
                        <Button variant="outline" size="sm" disabled={individualPage <= 1} onClick={() => setIndividualPage(p => p - 1)}>
                          Previous
                        </Button>
                        <Button variant="outline" size="sm" disabled={individualPage >= totalPages} onClick={() => setIndividualPage(p => p + 1)}>
                          Next
                        </Button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </TabsContent>

            <TabsContent value="batch">
              {(() => {
                const allBatches = topUpBatches;
                const totalPages = Math.ceil(allBatches.length / batchPageSize);
                const paginatedData = allBatches.slice((batchPage - 1) * batchPageSize, batchPage * batchPageSize);
                
                return (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Batch ID</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Accounts</TableHead>
                          <TableHead className="text-right">Total Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedData.map(batch => (
                          <TableRow key={batch.id}>
                            <TableCell>{formatDateTime(batch.createdAt)}</TableCell>
                            <TableCell className="font-mono text-sm">{batch.id}</TableCell>
                            <TableCell>{batch.description}</TableCell>
                            <TableCell>{batch.accountCount}</TableCell>
                            <TableCell className="text-right font-semibold text-success">
                              +{formatCurrency(batch.totalAmount)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={batch.status === 'completed' ? 'success' : batch.status === 'pending' ? 'warning' : 'destructive'}>
                                {batch.status === 'pending' ? 'Scheduled' : batch.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => handleViewDetails(batch)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Rows per page:</span>
                        <Select value={batchPageSize.toString()} onValueChange={(v) => { setBatchPageSize(Number(v)); setBatchPage(1); }}>
                          <SelectTrigger className="w-[70px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="30">30</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Page {batchPage} of {totalPages || 1} ({allBatches.length} records)
                        </span>
                        <Button variant="outline" size="sm" disabled={batchPage <= 1} onClick={() => setBatchPage(p => p - 1)}>
                          Previous
                        </Button>
                        <Button variant="outline" size="sm" disabled={batchPage >= totalPages} onClick={() => setBatchPage(p => p + 1)}>
                          Next
                        </Button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Ad-hoc Top-up Dialog */}
      <Dialog open={individualDialogOpen} onOpenChange={setIndividualDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ad-hoc Top-up</DialogTitle>
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

            {/* Amount */}
            <div className="space-y-2">
              <Label>Amount (SGD) *</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            {/* Internal Description */}
            <div className="space-y-2">
              <Label>Internal Description * (Admin only)</Label>
              <Textarea
                placeholder="e.g., Annual Education Grant, Youth Subsidy..."
                value={internalDescription}
                onChange={(e) => setInternalDescription(e.target.value)}
                rows={2}
              />
            </div>

            {/* External Description */}
            <div className="space-y-2">
              <Label>External Description (Visible to student)</Label>
              <Textarea
                placeholder="e.g., Education Subsidy Top-up..."
                value={externalDescription}
                onChange={(e) => setExternalDescription(e.target.value)}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">Leave empty to use internal description</p>
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
                      className="p-3 pointer-events-auto"
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

            {/* Internal Description */}
            <div className="space-y-2">
              <Label>Internal Description * (Admin only)</Label>
              <Textarea
                placeholder="e.g., Annual Education Subsidy..."
                value={batchInternalDescription}
                onChange={(e) => setBatchInternalDescription(e.target.value)}
                rows={2}
              />
            </div>

            {/* External Description */}
            <div className="space-y-2">
              <Label>External Description (Visible to student)</Label>
              <Textarea
                placeholder="e.g., Education Subsidy Top-up..."
                value={batchExternalDescription}
                onChange={(e) => setBatchExternalDescription(e.target.value)}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">Leave empty to use internal description</p>
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
                      className="p-3 pointer-events-auto"
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
                {eligibleAccounts.slice(0, 10).map(account => {
                  const holder = getAccountHolder(account.holderId);
                  return (
                    <div key={account.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                      <div>
                        <p className="font-medium">{holder?.firstName} {holder?.lastName}</p>
                        <p className="text-sm text-muted-foreground">{account.id}</p>
                      </div>
                      <span className="text-sm">{formatCurrency(account.balance)}</span>
                    </div>
                  );
                })}
                {eligibleAccounts.length > 10 && (
                  <div className="p-3 text-center text-sm text-muted-foreground">
                    ...and {eligibleAccounts.length - 10} more accounts
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBatchTopUp}>
              <Play className="h-4 w-4 mr-2" />
              {batchScheduleTopUp ? 'Schedule' : 'Execute'} Batch Top-up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-success">
              {successResult?.scheduled ? 'Top-up Scheduled' : 'Top-up Successful'}
            </DialogTitle>
            <DialogDescription>
              {successResult?.type === 'individual' 
                ? `Successfully ${successResult?.scheduled ? 'scheduled' : 'topped up'} ${successResult?.count} account(s)`
                : `Successfully ${successResult?.scheduled ? 'scheduled' : 'processed'} batch top-up for ${successResult?.count} accounts`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mb-4">
              <DollarSign className="h-8 w-8 text-success" />
            </div>
            <p className="text-2xl font-bold">{successResult && formatCurrency(successResult.total)}</p>
            <p className="text-muted-foreground">Total Amount</p>
          </div>
          <DialogFooter>
            <Button onClick={() => setSuccessDialogOpen(false)} className="w-full">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transaction Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Top-up Details</DialogTitle>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">ID</p>
                  <p className="font-mono">{selectedTransaction.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={selectedTransaction.status === 'completed' ? 'success' : selectedTransaction.status === 'pending' ? 'warning' : 'destructive'}>
                    {selectedTransaction.status === 'pending' ? 'Scheduled' : selectedTransaction.status}
                  </Badge>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Internal Description</p>
                <p className="font-medium">{selectedTransaction.description}</p>
              </div>
              
              {selectedTransaction.externalDescription && (
                <div>
                  <p className="text-sm text-muted-foreground">External Description (Student View)</p>
                  <p className="font-medium">{selectedTransaction.externalDescription}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {selectedTransaction.accountCount ? 'Total Accounts' : 'Account'}
                  </p>
                  <p className="font-medium">
                    {selectedTransaction.accountCount || selectedTransaction.accountId}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {selectedTransaction.totalAmount ? 'Total Amount' : 'Amount'}
                  </p>
                  <p className="font-medium text-success">
                    +{formatCurrency(selectedTransaction.totalAmount || selectedTransaction.amount)}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground">Created At</p>
                <p className="font-medium">{formatDateTime(selectedTransaction.createdAt)}</p>
              </div>
              
              {selectedTransaction.createdBy && (
                <div>
                  <p className="text-sm text-muted-foreground">Created By</p>
                  <p className="font-medium">{selectedTransaction.createdBy}</p>
                </div>
              )}

              {/* Configured Rules - For Batch Top-ups */}
              {selectedTransaction.accountCount && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">Configured Rules</p>
                  <div className="bg-secondary/50 rounded-lg p-3 text-sm space-y-1">
                    <p><span className="text-muted-foreground">Age Range:</span> All ages (no filter)</p>
                    <p><span className="text-muted-foreground">Balance Range:</span> All balances (no filter)</p>
                    <p><span className="text-muted-foreground">Schooling Status:</span> All statuses</p>
                    <p><span className="text-muted-foreground">Amount Type:</span> Per Account</p>
                    <p><span className="text-muted-foreground">Amount per Account:</span> {formatCurrency(selectedTransaction.totalAmount / selectedTransaction.accountCount)}</p>
                  </div>
                </div>
              )}

              {/* Accounts List - For Batch Top-ups */}
              {selectedTransaction.accountCount && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">
                    {selectedTransaction.status === 'pending' ? 'Accounts to Receive' : 'Accounts Received'} ({selectedTransaction.accountCount})
                  </p>
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Account ID</TableHead>
                          {selectedTransaction.status === 'completed' && (
                            <TableHead>Transaction ID</TableHead>
                          )}
                          <TableHead className="text-right">
                            {selectedTransaction.status === 'pending' ? 'Amount to Receive' : 'Amount Received'}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {educationAccounts.slice(0, selectedTransaction.accountCount).map((account, index) => {
                          const holder = getAccountHolder(account.holderId);
                          // Generate a mock transaction ID for completed batch top-ups
                          const mockTxnId = selectedTransaction.status === 'completed' 
                            ? `TXN${selectedTransaction.id.replace('BAT', '')}${String(index + 1).padStart(3, '0')}`
                            : null;
                          return (
                            <TableRow key={account.id}>
                              <TableCell className="font-medium">{holder?.firstName} {holder?.lastName}</TableCell>
                              <TableCell className="font-mono text-sm">{account.id}</TableCell>
                              {selectedTransaction.status === 'completed' && (
                                <TableCell className="font-mono text-sm">{mockTxnId}</TableCell>
                              )}
                              <TableCell className="text-right text-success">
                                +{formatCurrency(selectedTransaction.totalAmount / selectedTransaction.accountCount)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Individual Top-up Account Info */}
              {selectedTransaction.accountId && !selectedTransaction.accountCount && (
                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">Account Details</p>
                  {(() => {
                    const account = getEducationAccount(selectedTransaction.accountId);
                    const holder = account ? getAccountHolder(account.holderId) : null;
                    return account && holder ? (
                      <div className="border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{holder.firstName} {holder.lastName}</p>
                            <p className="text-sm text-muted-foreground">{account.id}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Amount Received</p>
                            <p className="font-medium text-success">+{formatCurrency(selectedTransaction.amount)}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Account details not available</p>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            {selectedTransaction?.status === 'pending' && selectedTransaction?.accountCount && (
              <Button 
                variant="outline" 
                onClick={() => {
                  // Pre-fill batch form with scheduled data and open batch dialog
                  setBatchAmount(String(selectedTransaction.totalAmount / selectedTransaction.accountCount));
                  setBatchAmountType('per_account');
                  setBatchInternalDescription(selectedTransaction.description || '');
                  setBatchExternalDescription(selectedTransaction.externalDescription || '');
                  setBatchScheduleTopUp(true);
                  setDetailsDialogOpen(false);
                  setBatchDialogOpen(true);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Schedule
              </Button>
            )}
            <Button onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default TopUpManagementPage;