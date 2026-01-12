import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Wallet, Calendar, Phone, Mail, MapPin, CreditCard, XCircle, Clock, TrendingUp, TrendingDown, Filter, BookOpen, DollarSign, CheckCircle, Eye, EyeOff, IdCard, Activity, UserCog, Building } from 'lucide-react';
import { updateEducationAccount, getAuditLogs } from '@/lib/dataStore';
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
  getOutstandingChargesByAccount,
  getCourse,
  getEnrolments
} from '@/lib/dataStore';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  getStatusLabel,
  getSchoolingLabel
} from '@/lib/data';
import { toast } from '@/hooks/use-toast';
import { useDataStore } from '@/hooks/useDataStore';

// Account Log entry type combining transactions, audit logs, and lifecycle events
interface AccountLogEntry {
  id: string;
  type: 'created' | 'activated' | 'suspended' | 'reactivated' | 'closed' | 'top_up' | 'charge' | 'payment' | 'enrolment' | 'admin_action';
  title: string;
  description: string;
  amount?: number;
  balanceAfter?: number;
  performedBy?: string;
  createdAt: string;
}

const AccountDetailPage: React.FC = () => {
  const { accountId } = useParams<{ accountId: string }>();
  
  // Use dataStore with useDataStore to get reactive data for newly created accounts
  const allAccounts = useDataStore(() => [getEducationAccount(accountId || '')].filter(Boolean));
  const account = allAccounts[0] || getEducationAccount(accountId || '');
  const holder = account ? getAccountHolder(account.holderId) : null;
  const transactions = account ? getTransactionsByAccount(account.id) : [];
  const allEnrolments = useDataStore(getEnrolments);
  const enrolments = holder ? allEnrolments.filter(e => e.holderId === holder.id) : [];
  const outstandingCharges = account ? getOutstandingChargesByAccount(account.id) : [];
  const auditLogs = useDataStore(getAuditLogs);
  
  const [logFilter, setLogFilter] = useState<'all' | 'transactions' | 'lifecycle' | 'admin'>('all');
  const [showFullNric, setShowFullNric] = useState(false);

  // Build comprehensive account log
  const accountLog = useMemo((): AccountLogEntry[] => {
    if (!account || !holder) return [];
    
    const entries: AccountLogEntry[] = [];
    
    // Account creation
    entries.push({
      id: `created-${account.id}`,
      type: 'created',
      title: 'Account Created',
      description: `Education account ${account.id} was created for ${holder.firstName} ${holder.lastName}`,
      performedBy: 'System',
      createdAt: account.openedAt + 'T00:00:00',
    });
    
    // Activation event (if not pending)
    if (account.status === 'active' || account.status === 'suspended' || account.status === 'closed') {
      entries.push({
        id: `activated-${account.id}`,
        type: 'activated',
        title: 'Account Activated',
        description: `Account was activated and ready for use`,
        performedBy: 'System',
        createdAt: account.openedAt + 'T00:01:00',
      });
    }
    
    // Suspension event
    if (account.suspendedAt) {
      entries.push({
        id: `suspended-${account.id}`,
        type: 'suspended',
        title: 'Account Suspended',
        description: `Account was suspended`,
        performedBy: 'Admin User',
        createdAt: account.suspendedAt + 'T00:00:00',
      });
    }
    
    // Closed event
    if (account.closedAt) {
      entries.push({
        id: `closed-${account.id}`,
        type: 'closed',
        title: 'Account Closed',
        description: `Account was closed`,
        performedBy: 'Admin User',
        createdAt: account.closedAt + 'T00:00:00',
      });
    }
    
    // Transaction entries
    transactions.forEach(txn => {
      let type: AccountLogEntry['type'] = 'top_up';
      let title = 'Top-up Received';
      
      if (txn.type === 'charge') {
        type = 'charge';
        title = 'Fee Charged';
      } else if (txn.type === 'payment') {
        type = 'payment';
        title = 'Online Payment Made';
      }
      
      entries.push({
        id: txn.id,
        type,
        title,
        description: txn.description,
        amount: txn.amount,
        balanceAfter: txn.balanceAfter,
        performedBy: txn.type === 'top_up' ? 'Admin User' : holder.firstName + ' ' + holder.lastName,
        createdAt: txn.createdAt,
      });
    });
    
    // Enrolment entries
    enrolments.forEach(enr => {
      const course = getCourse(enr.courseId);
      entries.push({
        id: `enrol-${enr.id}`,
        type: 'enrolment',
        title: 'Course Enrolled',
        description: `Enrolled in ${course?.name || 'Unknown Course'}`,
        performedBy: 'Admin User',
        createdAt: enr.startDate + 'T00:00:00',
      });
    });
    
    // Audit log entries related to this account
    const accountAuditLogs = auditLogs.filter(log => 
      log.entityId === account.id || log.entityId === holder.id
    );
    
    accountAuditLogs.forEach(log => {
      // Skip if we already have a corresponding entry
      if (log.action === 'Account Created' || log.action === 'Account Suspended' || log.action === 'Account Reactivated') {
        // Add reactivation entries
        if (log.action === 'Account Reactivated') {
          entries.push({
            id: log.id,
            type: 'reactivated',
            title: 'Account Reactivated',
            description: log.details,
            performedBy: log.userName,
            createdAt: log.createdAt,
          });
        } else {
          return; // Skip duplicates
        }
      } else {
        entries.push({
          id: log.id,
          type: 'admin_action',
          title: log.action,
          description: log.details,
          performedBy: log.userName,
          createdAt: log.createdAt,
        });
      }
    });
    
    // Sort by date (newest first)
    return entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [account, holder, transactions, enrolments, auditLogs]);

  // Filter log entries
  const filteredLog = useMemo(() => {
    return accountLog.filter(entry => {
      if (logFilter === 'all') return true;
      if (logFilter === 'transactions') return ['top_up', 'charge', 'payment'].includes(entry.type);
      if (logFilter === 'lifecycle') return ['created', 'activated', 'suspended', 'reactivated', 'closed', 'enrolment'].includes(entry.type);
      if (logFilter === 'admin') return entry.performedBy !== holder?.firstName + ' ' + holder?.lastName;
      return true;
    });
  }, [accountLog, logFilter, holder]);

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
    updateEducationAccount(account.id, { 
      status: 'suspended',
      suspendedAt: new Date().toISOString().split('T')[0]
    });
    toast({
      title: "Account Suspended",
      description: `Account ${account.id} has been suspended.`,
      variant: "destructive"
    });
  };

  const handleReactivate = () => {
    updateEducationAccount(account.id, { 
      status: 'active',
      suspendedAt: null
    });
    toast({
      title: "Account Reactivated",
      description: `Account ${account.id} has been reactivated.`,
    });
  };

  // Helper function to mask/display NRIC
  const displayNric = () => {
    if (!holder.nric || holder.nric.length < 4) return 'N/A';
    if (showFullNric) return holder.nric;
    return '****' + holder.nric.slice(-4);
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
  
  // Get log entry icon based on type
  const getLogIcon = (type: AccountLogEntry['type']) => {
    switch (type) {
      case 'created': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'activated': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'suspended': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'reactivated': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'closed': return <XCircle className="h-4 w-4 text-muted-foreground" />;
      case 'top_up': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'charge': return <TrendingDown className="h-4 w-4 text-destructive" />;
      case 'payment': return <DollarSign className="h-4 w-4 text-primary" />;
      case 'enrolment': return <BookOpen className="h-4 w-4 text-primary" />;
      case 'admin_action': return <UserCog className="h-4 w-4 text-muted-foreground" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getLogBadgeVariant = (type: AccountLogEntry['type']) => {
    switch (type) {
      case 'created':
      case 'activated':
      case 'reactivated':
        return 'success';
      case 'suspended':
      case 'closed':
        return 'destructive';
      case 'top_up':
        return 'success';
      case 'charge':
        return 'warning';
      case 'payment':
        return 'default';
      case 'enrolment':
        return 'secondary';
      case 'admin_action':
        return 'outline';
      default:
        return 'secondary';
    }
  };

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
                <IdCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">NRIC</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground font-mono">{displayNric()}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setShowFullNric(!showFullNric)}
                    >
                      {showFullNric ? (
                        <EyeOff className="h-3 w-3" />
                      ) : (
                        <Eye className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
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
              {account.suspendedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Account Suspended</span>
                  <span className="text-sm font-medium text-warning">{formatDate(account.suspendedAt)}</span>
                </div>
              )}
              {account.closedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Account Closed</span>
                  <span className="text-sm font-medium text-destructive">{formatDate(account.closedAt)}</span>
                </div>
              )}
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

      {/* Lower Section - Account Log */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Account Log
          </CardTitle>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={logFilter} onValueChange={(v) => setLogFilter(v as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activity</SelectItem>
                <SelectItem value="transactions">Transactions Only</SelectItem>
                <SelectItem value="lifecycle">Lifecycle Events</SelectItem>
                <SelectItem value="admin">Admin Actions</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Performed By</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLog.length > 0 ? (
                filteredLog.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      {getLogIcon(entry.type)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {formatDateTime(entry.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getLogBadgeVariant(entry.type) as any}>
                        {entry.title}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground max-w-[300px] truncate">
                        {entry.description}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserCog className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{entry.performedBy}</span>
                      </div>
                    </TableCell>
                    <TableCell className={`text-right font-medium ${entry.amount ? (entry.amount > 0 ? 'text-success' : 'text-destructive') : ''}`}>
                      {entry.amount ? (
                        <>{entry.amount > 0 ? '+' : ''}{formatCurrency(entry.amount)}</>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {entry.balanceAfter !== undefined ? formatCurrency(entry.balanceAfter) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No activity found
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