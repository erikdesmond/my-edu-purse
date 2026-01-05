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
  Clock
} from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { StatCard } from '@/components/shared/StatCard';
import { PageHeader } from '@/components/shared/PageHeader';
import {
  getActiveAccountsCount,
  getThisMonthTopUps,
  getThisMonthCharges,
  batches,
  transactions,
  formatCurrency,
  formatDateTime,
  educationAccounts
} from '@/lib/data';

const AdminDashboard: React.FC = () => {
  const activeAccounts = getActiveAccountsCount();
  const pendingAccounts = educationAccounts.filter(ea => ea.status === 'pending').length;
  const thisMonthTopUps = getThisMonthTopUps();
  const thisMonthCharges = getThisMonthCharges();
  const recentBatches = batches.slice(0, 3);
  const failedTransactions = transactions.filter(t => t.status === 'failed').slice(0, 5);

  return (
    <AdminLayout>
      <PageHeader 
        title="Dashboard" 
        description="Overview of Education Account operations"
      />

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          title="Active Accounts"
          value={activeAccounts}
          subtitle={`${pendingAccounts} pending activation`}
          icon={<Users className="h-6 w-6" />}
          variant="primary"
        />
        <StatCard
          title="New Accounts Today"
          value={2}
          icon={<Wallet className="h-6 w-6" />}
          variant="success"
        />
        <StatCard
          title="Top-ups This Month"
          value={thisMonthTopUps.count}
          subtitle={formatCurrency(thisMonthTopUps.amount)}
          icon={<TrendingUp className="h-6 w-6" />}
          variant="info"
        />
        <StatCard
          title="Charges This Month"
          value={thisMonthCharges.count}
          subtitle={formatCurrency(thisMonthCharges.amount)}
          icon={<CreditCard className="h-6 w-6" />}
          variant="warning"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Batches */}
        <Card className="animate-slide-up">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold">Recent Batches</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/topups/batch">
                View all <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBatches.map((batch) => (
                <div key={batch.id} className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-secondary/50">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Calendar className="h-5 w-5 text-primary" />
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
            </div>
          </CardContent>
        </Card>

        {/* Exceptions / Failed Transactions */}
        <Card className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Exceptions
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
                {failedTransactions.map((txn) => (
                  <div key={txn.id} className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                        <AlertCircle className="h-5 w-5 text-destructive" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{txn.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(txn.createdAt)} • {formatCurrency(txn.amount)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="destructive">Failed</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 mb-3">
                  <Clock className="h-6 w-6 text-success" />
                </div>
                <p className="font-medium text-foreground">No exceptions</p>
                <p className="text-sm text-muted-foreground">All operations are running smoothly</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
