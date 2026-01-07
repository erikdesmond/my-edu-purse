import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Wallet, 
  TrendingUp, 
  AlertCircle, 
  ArrowRight,
  CreditCard,
  Calendar,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { StatCard } from '@/components/shared/StatCard';
import { PageHeader } from '@/components/shared/PageHeader';
import { useDataStore } from '@/hooks/useDataStore';
import { 
  getEducationAccounts, 
  getBatches, 
  getTransactions,
  getOutstandingCharges,
  getAccountHolder
} from '@/lib/dataStore';
import { formatCurrency, formatDateTime } from '@/lib/data';
import { useState } from 'react';

const AdminDashboard: React.FC = () => {
  const educationAccounts = useDataStore(getEducationAccounts);
  const batches = useDataStore(getBatches);
  const transactions = useDataStore(getTransactions);
  const outstandingCharges = useDataStore(getOutstandingCharges);
  
  const [topUpFilter, setTopUpFilter] = useState<string>('all');

  // Calculate stats
  const activeAccounts = educationAccounts.filter(ea => ea.status === 'active').length;
  const today = new Date().toISOString().split('T')[0];
  const newAccountsToday = educationAccounts.filter(ea => ea.openedAt === today).length;
  
  // This month's top-ups
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthTopUps = transactions.filter(t => 
    t.type === 'top_up' && t.createdAt.startsWith(thisMonth) && t.status === 'completed'
  );
  const totalDisbursed = thisMonthTopUps.reduce((sum, t) => sum + t.amount, 0);
  
  // Outstanding fees
  const totalOutstanding = outstandingCharges
    .filter(c => c.status === 'unpaid' || c.status === 'overdue')
    .reduce((sum, c) => sum + c.amount, 0);

  // Recent batches for processing status
  const recentBatches = batches.slice(0, 5);
  
  // Failed/exception transactions
  const failedTransactions = transactions.filter(t => t.status === 'failed').slice(0, 5);
  
  // Top-up history with filter
  const topUpTransactions = transactions
    .filter(t => t.type === 'top_up')
    .filter(t => {
      if (topUpFilter === 'batch') return t.reference.startsWith('BAT') || t.reference.includes('-EA');
      if (topUpFilter === 'individual') return t.reference.startsWith('INDIV') || t.reference.startsWith('MAN');
      return true;
    })
    .slice(0, 10);

  return (
    <AdminLayout>
      <PageHeader 
        title="Dashboard" 
        description="Overview of Education Account operations"
      />

      {/* Top Row: 4 Metric Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Total Active Accounts"
          value={activeAccounts}
          subtitle={`${educationAccounts.length} total accounts`}
          icon={<Users className="h-6 w-6" />}
          variant="primary"
        />
        <StatCard
          title="New Accounts Today"
          value={newAccountsToday}
          subtitle="New registrations"
          icon={<Wallet className="h-6 w-6" />}
          variant="success"
        />
        <StatCard
          title="Total Disbursed"
          value={formatCurrency(totalDisbursed)}
          subtitle={`${thisMonthTopUps.length} top-ups this month`}
          icon={<TrendingUp className="h-6 w-6" />}
          variant="info"
        />
        <StatCard
          title="Total Outstanding Fees"
          value={formatCurrency(totalOutstanding)}
          subtitle={`${outstandingCharges.filter(c => c.status === 'unpaid' || c.status === 'overdue').length} pending payments`}
          icon={<DollarSign className="h-6 w-6" />}
          variant="warning"
        />
      </div>

      {/* Middle Section: Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {/* Batch Processing Status */}
        <Card className="animate-slide-up">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Batch Processing Status
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/topups">
                View all <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBatches.map((batch) => (
                <div key={batch.id} className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-secondary/50">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      batch.status === 'completed' ? 'bg-success/10' : 
                      batch.status === 'pending' ? 'bg-warning/10' : 'bg-destructive/10'
                    }`}>
                      {batch.status === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : batch.status === 'pending' ? (
                        <Clock className="h-5 w-5 text-warning" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{batch.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {batch.accountCount} accounts • {formatCurrency(batch.totalAmount)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={batch.status === 'completed' ? 'success' : batch.status === 'pending' ? 'warning' : 'destructive'}>
                    {batch.status}
                  </Badge>
                </div>
              ))}
              {recentBatches.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No batch processing history</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Exceptions & Alerts */}
        <Card className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Exceptions & Alerts
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/audit">
                View all <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {failedTransactions.length > 0 ? (
              <div className="space-y-4">
                {failedTransactions.map((txn) => {
                  const account = educationAccounts.find(ea => ea.id === txn.accountId);
                  const holder = account ? getAccountHolder(account.holderId) : null;
                  
                  return (
                    <div key={txn.id} className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                          <AlertCircle className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{txn.description}</p>
                          <p className="text-sm text-muted-foreground">
                            {holder ? `${holder.firstName} ${holder.lastName}` : txn.accountId} • {formatDateTime(txn.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive">Failed</Badge>
                        <p className="text-sm font-medium mt-1">{formatCurrency(Math.abs(txn.amount))}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 mb-3">
                  <CheckCircle2 className="h-6 w-6 text-success" />
                </div>
                <p className="font-medium text-foreground">No exceptions</p>
                <p className="text-sm text-muted-foreground">All operations are running smoothly</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Top-up History Table */}
      <Card className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-info" />
            Top-up History
          </CardTitle>
          <div className="flex items-center gap-4">
            <Select value={topUpFilter} onValueChange={setTopUpFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="batch">Batch</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/topups">
                View all <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topUpTransactions.map(txn => {
                const account = educationAccounts.find(ea => ea.id === txn.accountId);
                const holder = account ? getAccountHolder(account.holderId) : null;
                const isBatch = txn.reference.startsWith('BAT') || txn.reference.includes('-EA');
                
                return (
                  <TableRow key={txn.id}>
                    <TableCell className="font-mono text-sm">{txn.id}</TableCell>
                    <TableCell>
                      {holder ? `${holder.firstName} ${holder.lastName}` : txn.accountId}
                    </TableCell>
                    <TableCell>{txn.description}</TableCell>
                    <TableCell>
                      <Badge variant={isBatch ? 'info' : 'secondary'}>
                        {isBatch ? 'Batch' : 'Individual'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-success">
                      +{formatCurrency(txn.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={txn.status === 'completed' ? 'success' : txn.status === 'pending' ? 'warning' : 'destructive'}>
                        {txn.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDateTime(txn.createdAt)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminDashboard;