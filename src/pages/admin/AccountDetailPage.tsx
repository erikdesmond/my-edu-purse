import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Wallet, Calendar, Phone, Mail, MapPin, CreditCard, XCircle, Clock, TrendingUp, TrendingDown, Filter, BookOpen, DollarSign, CheckCircle } from 'lucide-react';
import { updateEducationAccount } from '@/lib/dataStore';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  getEducationAccount,
  getAccountHolder,
  getTransactionsByAccount,
  getEnrolmentsByHolder,
  getCourse,
  formatCurrency,
  formatDate,
  formatDateTime,
  getStatusLabel,
  getSchoolingLabel,
  getOutstandingChargesByAccount
} from '@/lib/data';
import { toast } from '@/hooks/use-toast';

const AccountDetailPage: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const account = getEducationAccount(accountId || '');
  const holder = account ? getAccountHolder(account.holderId) : null;
  const transactions = account ? getTransactionsByAccount(account.id) : [];
  const enrolments = holder ? getEnrolmentsByHolder(holder.id) : [];
  const outstandingCharges = account ? getOutstandingChargesByAccount(account.id) : [];
  
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'in' | 'out'>('all');

  if (!account || !holder) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-lg font-medium text-foreground">Account not found</p>
          <Button variant="link" asChild className="mt-2">
            <Link to="/admin/accounts">Back to Accounts</Link>
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const handleSuspend = () => {
    updateEducationAccount(account.id, { status: 'suspended' });
    toast({
      title: "Account Suspended",
      description: `Account ${account.id} has been suspended.`,
      variant: "destructive"
    });
  };

  const handleReactivate = () => {
    updateEducationAccount(account.id, { status: 'active' });
    toast({
      title: "Account Reactivated",
      description: `Account ${account.id} has been reactivated.`,
    });
  };

  // Calculate financial statistics
  const totalTopUps = transactions
    .filter(t => t.type === 'top_up' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalCharges = Math.abs(transactions
    .filter(t => t.type === 'charge' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0));
  
  const totalPayments = transactions
    .filter(t => t.type === 'payment' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const overallMoneyIn = totalTopUps + totalPayments;
  const overallMoneyOut = totalCharges;
  
  // Filter transactions based on selection
  const filteredTransactions = transactions.filter(t => {
    if (transactionFilter === 'all') return true;
    if (transactionFilter === 'in') return t.amount > 0;
    if (transactionFilter === 'out') return t.amount < 0;
    return true;
  });

  // Get payment status for each course (only Paid, Pending Payment, Unpaid)
  const getCoursePaymentStatus = (courseId: string): 'paid' | 'pending' | 'unpaid' => {
    const charge = outstandingCharges.find(c => c.courseId === courseId);
    if (!charge) return 'paid';
    return 'pending';
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link to="/admin/accounts">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Accounts
          </Link>
        </Button>
      </div>

      <PageHeader 
        title={`${holder.firstName} ${holder.lastName}`}
        description={`Account ID: ${account.id}`}
      >
        <Button variant="outline" asChild>
          <Link to={`/admin/topup-management`}>
            <CreditCard className="h-4 w-4 mr-2" />
            Top-up
          </Link>
        </Button>
        {account.status === 'active' && (
          <Button variant="destructive" onClick={handleSuspend}>
            <XCircle className="h-4 w-4 mr-2" />
            Suspend
          </Button>
        )}
        {account.status === 'suspended' && (
          <Button variant="default" onClick={handleReactivate}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Re-activate
          </Button>
        )}
      </PageHeader>

      {/* Account Overview - Upper Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard
          title="Current Balance"
          value={formatCurrency(account.balance)}
          subtitle="Available funds"
          icon={<Wallet className="h-5 w-5" />}
          variant="primary"
        />
        <StatCard
          title="Total Top-ups Received"
          value={formatCurrency(totalTopUps)}
          subtitle={`Since ${formatDate(account.openedAt)}`}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          title="Balance Spent"
          value={formatCurrency(totalCharges)}
          subtitle="Paid via account balance"
          icon={<TrendingDown className="h-5 w-5" />}
          variant="warning"
        />
        <StatCard
          title="Online Payments"
          value={formatCurrency(totalPayments)}
          subtitle="Paid via online methods"
          icon={<DollarSign className="h-5 w-5" />}
          variant="info"
        />
      </div>

      {/* Middle Section - Profile and All Courses */}
      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                <span className="text-xl font-semibold text-secondary-foreground">
                  {holder.firstName[0]}{holder.lastName[0]}
                </span>
              </div>
              <div>
                <p className="font-medium">{holder.firstName} {holder.lastName}</p>
                <p className="text-sm text-muted-foreground">Education Account: {account.id}</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Date of Birth</p>
                  <p className="text-sm text-muted-foreground">{formatDate(holder.dateOfBirth)} ({holder.age} years old)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{holder.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{holder.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">{holder.address}</p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Schooling Status</span>
                <span className="text-sm font-medium">{getSchoolingLabel(holder.schoolingStatus)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Account Status</span>
                <Badge variant={account.status as any}>{getStatusLabel(account.status)}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Account Opened</span>
                <span className="text-sm font-medium">{formatDate(account.openedAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Top-up</span>
                <span className="text-sm font-medium">{account.lastTopUpDate ? formatDate(account.lastTopUpDate) : 'Never'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* All Courses Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              All Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {enrolments.length > 0 ? (
              <div className="space-y-3">
                {enrolments.map((enrolment) => {
                  const course = getCourse(enrolment.courseId);
                  const paymentStatus = getCoursePaymentStatus(enrolment.courseId);
                  const charge = outstandingCharges.find(c => c.courseId === enrolment.courseId);
                  
                  return (
                    <div key={enrolment.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{course?.name}</p>
                          <Badge variant="secondary">{course?.code}</Badge>
                          <Badge variant={enrolment.isActive ? 'active' : 'closed'}>
                            {enrolment.isActive ? 'Active' : 'Completed'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Started: {formatDate(enrolment.startDate)}
                          {enrolment.endDate && ` • Ended: ${formatDate(enrolment.endDate)}`}
                        </p>
                        {charge && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Total Fee: {course && formatCurrency(course.monthlyFee * (course.durationMonths || 1))} • 
                            Remaining: {formatCurrency(charge.amount)} • 
                            Next Payment: {formatDate(charge.dueDate)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-sm font-medium">{course && formatCurrency(course.monthlyFee)}</span>
                          <span className="text-xs text-muted-foreground block">
                            {course?.paymentType === 'one_time' ? 'one-time' : '/mo'}
                          </span>
                        </div>
                        <Badge 
                          variant={
                            paymentStatus === 'paid' ? 'success' : 'warning'
                          }
                        >
                          {paymentStatus === 'paid' && 'Paid'}
                          {paymentStatus === 'pending' && `Pending ${charge ? formatCurrency(charge.amount) : ''}`}
                          {paymentStatus === 'unpaid' && `Unpaid ${charge ? formatCurrency(charge.amount) : ''}`}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No courses enrolled</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Lower Section - Transaction History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Transaction History
          </CardTitle>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={transactionFilter} onValueChange={(v) => setTransactionFilter(v as any)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="in">Money In</SelectItem>
                <SelectItem value="out">Money Out</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell className="text-sm">
                      {formatDateTime(txn.createdAt)}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{txn.description}</p>
                      {txn.period && (
                        <p className="text-xs text-muted-foreground">{txn.period}</p>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {txn.reference}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${txn.amount > 0 ? 'text-success' : 'text-destructive'}`}>
                      {txn.amount > 0 ? '+' : ''}{formatCurrency(txn.amount)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatCurrency(txn.balanceAfter)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={txn.status === 'completed' ? 'success' : txn.status === 'pending' ? 'warning' : 'destructive'}>
                        {txn.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No transactions found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AccountDetailPage;