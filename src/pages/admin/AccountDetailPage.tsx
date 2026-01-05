import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Wallet, Calendar, Phone, Mail, MapPin, Edit, CreditCard, XCircle, Clock } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { PageHeader } from '@/components/shared/PageHeader';
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
  getEducationAccount,
  getAccountHolder,
  getTransactionsByAccount,
  getEnrolmentsByHolder,
  getCourse,
  formatCurrency,
  formatDate,
  formatDateTime,
  getStatusLabel,
  getSchoolingLabel
} from '@/lib/data';
import { toast } from '@/hooks/use-toast';

const AccountDetailPage: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const account = getEducationAccount(accountId || '');
  const holder = account ? getAccountHolder(account.holderId) : null;
  const transactions = account ? getTransactionsByAccount(account.id) : [];
  const enrolments = holder ? getEnrolmentsByHolder(holder.id) : [];

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
    toast({
      title: "Account Suspended",
      description: `Account ${account.id} has been suspended.`,
      variant: "destructive"
    });
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
          <Link to={`/admin/topups/single?account=${account.id}`}>
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
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Account Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Balance Card */}
          <Card className="overflow-hidden">
            <div className="bg-primary p-6 text-primary-foreground">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-foreground/20">
                  <Wallet className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm opacity-90">Current Balance</p>
                  <p className="text-3xl font-bold">{formatCurrency(account.balance)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm opacity-90">
                <span>Last top-up</span>
                <span>{account.lastTopUpDate ? formatDate(account.lastTopUpDate) : 'Never'}</span>
              </div>
            </div>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Account Status</span>
                <Badge variant={account.status as any}>{getStatusLabel(account.status)}</Badge>
              </div>
            </CardContent>
          </Card>

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
                  <p className="text-sm text-muted-foreground">ID: {holder.id}</p>
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

              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Schooling Status</span>
                  <span className="text-sm font-medium">{getSchoolingLabel(holder.schoolingStatus)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enrolments Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Active Enrolments</CardTitle>
            </CardHeader>
            <CardContent>
              {enrolments.filter(e => e.isActive).length > 0 ? (
                <div className="space-y-3">
                  {enrolments.filter(e => e.isActive).map((enrolment) => {
                    const course = getCourse(enrolment.courseId);
                    return (
                      <div key={enrolment.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <p className="font-medium text-sm">{course?.name}</p>
                          <p className="text-xs text-muted-foreground">Since {formatDate(enrolment.startDate)}</p>
                        </div>
                        <span className="text-sm font-medium">{course && formatCurrency(course.monthlyFee)}/mo</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No active enrolments</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Transaction History */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Transaction History
              </CardTitle>
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
                  {transactions.length > 0 ? (
                    transactions.map((txn) => (
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
        </div>
      </div>
    </AdminLayout>
  );
};

export default AccountDetailPage;
