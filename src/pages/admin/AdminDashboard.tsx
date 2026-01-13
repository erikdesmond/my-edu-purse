import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  ArrowRight,
  CreditCard,
  Calendar,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BookOpen,
  AlertOctagon,
  Info,
  ShieldAlert,
  Activity,
  Building
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
import { PageHeader } from '@/components/shared/PageHeader';
import { useDataStore } from '@/hooks/useDataStore';
import { 
  getEducationAccounts, 
  getBatches, 
  getTransactions,
  getOutstandingCharges,
  getAccountHolder,
  getEnrolments,
  getCourses
} from '@/lib/dataStore';
import { formatCurrency, formatDateTime, EDUCATION_PROVIDERS } from '@/lib/data';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from 'recharts';

// ============== Stats Card Components ==============

interface DetailedStatsCardProps {
  title: string;
  icon: React.ReactNode;
  linkTo?: string;
  linkLabel?: string;
  children: React.ReactNode;
  className?: string;
}

const DetailedStatsCard: React.FC<DetailedStatsCardProps> = ({ 
  title, 
  icon, 
  linkTo, 
  linkLabel = "View Details",
  children,
  className = ""
}) => (
  <Card className={`animate-slide-up ${className}`}>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium flex items-center gap-2">
        {icon}
        {title}
      </CardTitle>
      {linkTo && (
        <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
          <Link to={linkTo}>
            {linkLabel} <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </Button>
      )}
    </CardHeader>
    <CardContent className="space-y-2">
      {children}
    </CardContent>
  </Card>
);

interface StatRowProps {
  label: string;
  value: string | number;
  trend?: { value: number; isPositive: boolean };
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const StatRow: React.FC<StatRowProps> = ({ label, value, trend, variant = 'default' }) => {
  const valueColors = {
    default: 'text-foreground',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-destructive'
  };
  
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`font-semibold ${valueColors[variant]}`}>{value}</span>
        {trend && (
          <span className={`flex items-center text-xs ${trend.isPositive ? 'text-success' : 'text-destructive'}`}>
            {trend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend.value}%
          </span>
        )}
      </div>
    </div>
  );
};

// ============== Action Items Component ==============

interface ActionItem {
  id: string;
  type: 'high' | 'medium' | 'low' | 'reminder';
  title: string;
  description: string;
  count?: number;
  linkTo?: string;
}

const ActionItemCard: React.FC<{ item: ActionItem }> = ({ item }) => {
  const priorityStyles = {
    high: { bg: 'bg-destructive/10', border: 'border-destructive/30', icon: <AlertOctagon className="h-4 w-4 text-destructive" />, badge: 'destructive' as const },
    medium: { bg: 'bg-warning/10', border: 'border-warning/30', icon: <AlertTriangle className="h-4 w-4 text-warning" />, badge: 'warning' as const },
    low: { bg: 'bg-info/10', border: 'border-info/30', icon: <Info className="h-4 w-4 text-info" />, badge: 'info' as const },
    reminder: { bg: 'bg-secondary/50', border: 'border-border', icon: <Clock className="h-4 w-4 text-muted-foreground" />, badge: 'secondary' as const }
  };
  
  const styles = priorityStyles[item.type];
  
  return (
    <div className={`flex items-center justify-between rounded-lg border p-3 ${styles.bg} ${styles.border}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-background">
          {styles.icon}
        </div>
        <div>
          <p className="text-sm font-medium">{item.title}</p>
          <p className="text-xs text-muted-foreground">{item.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {item.count !== undefined && (
          <Badge variant={styles.badge}>{item.count}</Badge>
        )}
        {item.linkTo && (
          <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
            <Link to={item.linkTo}>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
};

// ============== System Alert Component ==============

interface SystemAlert {
  id: string;
  type: 'error' | 'success' | 'info' | 'security';
  message: string;
  timestamp: string;
}

const SystemAlertRow: React.FC<{ alert: SystemAlert }> = ({ alert }) => {
  const alertStyles = {
    error: { icon: <XCircle className="h-4 w-4 text-destructive" />, bg: 'bg-destructive/5' },
    success: { icon: <CheckCircle2 className="h-4 w-4 text-success" />, bg: 'bg-success/5' },
    info: { icon: <Info className="h-4 w-4 text-info" />, bg: 'bg-info/5' },
    security: { icon: <ShieldAlert className="h-4 w-4 text-warning" />, bg: 'bg-warning/5' }
  };
  
  const styles = alertStyles[alert.type];
  
  return (
    <div className={`flex items-center gap-3 rounded-md p-2 ${styles.bg}`}>
      {styles.icon}
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{alert.message}</p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">{alert.timestamp}</span>
    </div>
  );
};

// ============== Main Dashboard Component ==============

const AdminDashboard: React.FC = () => {
  const educationAccounts = useDataStore(getEducationAccounts);
  const batches = useDataStore(getBatches);
  const transactions = useDataStore(getTransactions);
  const outstandingCharges = useDataStore(getOutstandingCharges);
  const enrolments = useDataStore(getEnrolments);
  const courses = useDataStore(getCourses);
  
  const [trendPeriod, setTrendPeriod] = useState<'7' | '14'>('7');

  // ============== Stats Calculations ==============
  
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const lastMonth = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`;
  
  // Account Stats
  const totalAccounts = educationAccounts.length;
  const activeAccounts = educationAccounts.filter(ea => ea.status === 'active').length;
  const suspendedAccounts = educationAccounts.filter(ea => ea.status === 'suspended').length;
  const closedAccounts = educationAccounts.filter(ea => ea.status === 'closed').length;
  
  // Account trend (compare to last month - simulated)
  const accountTrend = { value: 5.2, isPositive: true };
  
  // Top-up Stats
  const todayTopUps = transactions.filter(t => 
    t.type === 'top_up' && t.createdAt.startsWith(today) && t.status === 'completed'
  );
  const todayTopUpCount = todayTopUps.length;
  const todayTopUpAmount = todayTopUps.reduce((sum, t) => sum + t.amount, 0);
  
  const thisMonthTopUps = transactions.filter(t => 
    t.type === 'top_up' && t.createdAt.startsWith(thisMonth) && t.status === 'completed'
  );
  const monthTopUpCount = thisMonthTopUps.length;
  const monthTopUpAmount = thisMonthTopUps.reduce((sum, t) => sum + t.amount, 0);
  const averageTopUp = monthTopUpCount > 0 ? monthTopUpAmount / monthTopUpCount : 0;
  
  // Outstanding Charges Stats
  const unpaidCharges = outstandingCharges.filter(c => c.status === 'unpaid' || c.status === 'overdue');
  const totalOutstandingCount = unpaidCharges.length;
  const totalOutstandingAmount = unpaidCharges.reduce((sum, c) => sum + c.amount, 0);
  
  // Due soon (within 7 days)
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const dueSoonCharges = unpaidCharges.filter(c => c.dueDate <= sevenDaysFromNow);
  const dueSoonCount = dueSoonCharges.length;
  const dueSoonAmount = dueSoonCharges.reduce((sum, c) => sum + c.amount, 0);
  
  // Active Enrolments Stats
  const activeEnrolments = enrolments.filter(e => e.isActive);
  const totalActiveEnrolments = activeEnrolments.length;
  
  // Breakdown by provider
  const enrolmentsByProvider = useMemo(() => {
    const providerMap = new Map<string, number>();
    activeEnrolments.forEach(enrolment => {
      const course = courses.find(c => c.id === enrolment.courseId);
      if (course) {
        const count = providerMap.get(course.provider) || 0;
        providerMap.set(course.provider, count + 1);
      }
    });
    return Array.from(providerMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [activeEnrolments, courses]);
  
  // Enrolment trend (simulated month-over-month)
  const enrolmentTrend = { value: 8.3, isPositive: true };
  
  // ============== Action Items ==============
  
  const actionItems: ActionItem[] = useMemo(() => {
    const items: ActionItem[] = [];
    
    // High priority: Overdue charges
    const overdueCharges = outstandingCharges.filter(c => c.status === 'overdue');
    if (overdueCharges.length > 0) {
      items.push({
        id: 'overdue',
        type: 'high',
        title: 'Overdue Charges',
        description: `${formatCurrency(overdueCharges.reduce((sum, c) => sum + c.amount, 0))} total overdue`,
        count: overdueCharges.length,
        linkTo: '/admin/accounts'
      });
    }
    
    // High priority: Suspended accounts
    if (suspendedAccounts > 0) {
      items.push({
        id: 'suspended',
        type: 'high',
        title: 'Suspended Accounts',
        description: 'Accounts requiring attention',
        count: suspendedAccounts,
        linkTo: '/admin/accounts'
      });
    }
    
    // Medium priority: Pending batch approvals
    const pendingBatches = batches.filter(b => b.status === 'pending');
    if (pendingBatches.length > 0) {
      items.push({
        id: 'pending-batch',
        type: 'medium',
        title: 'Pending Batch Approvals',
        description: `${formatCurrency(pendingBatches.reduce((sum, b) => sum + b.totalAmount, 0))} awaiting approval`,
        count: pendingBatches.length,
        linkTo: '/admin/topups'
      });
    }
    
    // Low priority: Due soon
    if (dueSoonCount > 0) {
      items.push({
        id: 'due-soon',
        type: 'low',
        title: 'Payments Due Soon',
        description: `Due within 7 days`,
        count: dueSoonCount,
        linkTo: '/admin/accounts'
      });
    }
    
    // Reminder: Pending accounts
    const pendingAccounts = educationAccounts.filter(ea => ea.status === 'pending');
    if (pendingAccounts.length > 0) {
      items.push({
        id: 'pending-accounts',
        type: 'reminder',
        title: 'Pending Account Activations',
        description: 'Awaiting activation',
        count: pendingAccounts.length,
        linkTo: '/admin/accounts'
      });
    }
    
    return items;
  }, [outstandingCharges, suspendedAccounts, batches, dueSoonCount, educationAccounts]);
  
  // ============== System Alerts ==============
  
  const systemAlerts: SystemAlert[] = useMemo(() => {
    const alerts: SystemAlert[] = [];
    
    // Check for failed transactions
    const failedTxns = transactions.filter(t => t.status === 'failed');
    if (failedTxns.length > 0) {
      alerts.push({
        id: 'failed-txn',
        type: 'error',
        message: `${failedTxns.length} transaction(s) failed`,
        timestamp: 'Today'
      });
    }
    
    // Completed batches
    const recentCompletedBatches = batches.filter(b => b.status === 'completed').slice(0, 1);
    recentCompletedBatches.forEach(batch => {
      alerts.push({
        id: `batch-${batch.id}`,
        type: 'success',
        message: `Batch "${batch.description}" completed successfully`,
        timestamp: formatDateTime(batch.createdAt).split(',')[0]
      });
    });
    
    // Info about system
    alerts.push({
      id: 'system-info',
      type: 'info',
      message: 'System running normally',
      timestamp: 'Now'
    });
    
    return alerts;
  }, [transactions, batches]);
  
  // ============== Recent Transactions ==============
  
  const recentTransactions = useMemo(() => {
    return transactions
      .slice()
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [transactions]);
  
  // ============== Trend Chart Data ==============
  
  const trendChartData = useMemo(() => {
    const days = parseInt(trendPeriod);
    const data: { date: string; amount: number }[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayTopUps = transactions.filter(t => 
        t.type === 'top_up' && 
        t.status === 'completed' && 
        t.createdAt.startsWith(dateStr)
      );
      const amount = dayTopUps.reduce((sum, t) => sum + t.amount, 0);
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount
      });
    }
    
    return data;
  }, [transactions, trendPeriod, now]);
  
  const chartConfig = {
    amount: {
      label: "Top-up Amount",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <AdminLayout>
      <PageHeader 
        title="Dashboard" 
        description="Overview of Education Account operations"
      />

      {/* Three Column Layout */}
      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        
        {/* ============== Left Column: Stats Cards ============== */}
        <div className="space-y-4">
          
          {/* Total Accounts Card */}
          <DetailedStatsCard 
            title="Total Accounts" 
            icon={<Users className="h-4 w-4 text-primary" />}
            linkTo="/admin/accounts"
          >
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{totalAccounts}</span>
              <span className="flex items-center text-xs text-success">
                <TrendingUp className="h-3 w-3 mr-1" />
                {accountTrend.value}%
              </span>
            </div>
            <div className="space-y-1 pt-2 border-t">
              <StatRow label="Active" value={activeAccounts} variant="success" />
              <StatRow label="Suspended" value={suspendedAccounts} variant="warning" />
              <StatRow label="Closed" value={closedAccounts} variant="default" />
            </div>
          </DetailedStatsCard>
          
          {/* Top-Ups Card */}
          <DetailedStatsCard 
            title="Top-Ups (Today & Monthly)" 
            icon={<Wallet className="h-4 w-4 text-success" />}
            linkTo="/admin/topups"
            linkLabel="Manage Top-ups"
          >
            <div className="grid grid-cols-2 gap-4 pb-2">
              <div>
                <p className="text-xs text-muted-foreground">Today</p>
                <p className="text-lg font-bold">{todayTopUpCount}</p>
                <p className="text-sm text-success">{formatCurrency(todayTopUpAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">This Month</p>
                <p className="text-lg font-bold">{monthTopUpCount}</p>
                <p className="text-sm text-success">{formatCurrency(monthTopUpAmount)}</p>
              </div>
            </div>
            <div className="border-t pt-2">
              <StatRow label="Average per Top-up" value={formatCurrency(averageTopUp)} />
            </div>
          </DetailedStatsCard>
          
          {/* Outstanding Charges Card */}
          <DetailedStatsCard 
            title="Outstanding Charges" 
            icon={<DollarSign className="h-4 w-4 text-warning" />}
            linkTo="/admin/accounts"
          >
            <div className="space-y-1">
              <StatRow label="Total Outstanding" value={totalOutstandingCount} />
              <StatRow label="Total Amount" value={formatCurrency(totalOutstandingAmount)} variant="warning" />
            </div>
            <div className="border-t pt-2 mt-2">
              <p className="text-xs text-muted-foreground mb-1">Due within 7 days</p>
              <div className="flex items-center justify-between">
                <Badge variant="warning">{dueSoonCount} charges</Badge>
                <span className="font-semibold text-warning">{formatCurrency(dueSoonAmount)}</span>
              </div>
            </div>
          </DetailedStatsCard>
          
          {/* Active Enrolments Card */}
          <DetailedStatsCard 
            title="Active Enrolments" 
            icon={<BookOpen className="h-4 w-4 text-info" />}
            linkTo="/admin/courses"
            linkLabel="Course Management"
          >
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{totalActiveEnrolments}</span>
              <span className="flex items-center text-xs text-success">
                <TrendingUp className="h-3 w-3 mr-1" />
                {enrolmentTrend.value}% MoM
              </span>
            </div>
            <div className="space-y-1 pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-1">By Provider</p>
              {enrolmentsByProvider.map(([provider, count]) => (
                <div key={provider} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground truncate max-w-[150px]">{provider}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
              {enrolmentsByProvider.length === 0 && (
                <p className="text-sm text-muted-foreground">No active enrolments</p>
              )}
            </div>
          </DetailedStatsCard>
        </div>
        
        {/* ============== Center Column: Actions & Alerts ============== */}
        <div className="space-y-4">
          
          {/* Action Required Card */}
          <Card className="animate-slide-up">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-warning" />
                Action Required
              </CardTitle>
              <Badge variant="outline">{actionItems.length} items</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {actionItems.length > 0 ? (
                actionItems.map(item => (
                  <ActionItemCard key={item.id} item={item} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  </div>
                  <p className="text-sm font-medium">No actions required</p>
                  <p className="text-xs text-muted-foreground">All systems operational</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* System Alerts Card */}
          <Card className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-info" />
                System Alerts
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                <Link to="/admin/audit">
                  View All <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {systemAlerts.map(alert => (
                <SystemAlertRow key={alert.id} alert={alert} />
              ))}
            </CardContent>
          </Card>
        </div>
        
        {/* ============== Right Column: Activity & Charts ============== */}
        <div className="space-y-4">
          
          {/* Recent Transactions Card */}
          <Card className="animate-slide-up">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-primary" />
                Recent Transactions
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                <Link to="/admin/topups">
                  View All <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTransactions.map(txn => {
                  const account = educationAccounts.find(ea => ea.id === txn.accountId);
                  const holder = account ? getAccountHolder(account.holderId) : null;
                  const isCredit = txn.type === 'top_up' || txn.type === 'payment';
                  
                  return (
                    <div key={txn.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            txn.type === 'top_up' ? 'success' : 
                            txn.type === 'charge' ? 'warning' : 'info'
                          } className="text-xs">
                            {txn.type.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(txn.createdAt).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                        <p className="text-sm truncate mt-1">
                          {holder ? `${holder.firstName} ${holder.lastName}` : txn.accountId}
                        </p>
                      </div>
                      <span className={`font-semibold ${isCredit ? 'text-success' : 'text-destructive'}`}>
                        {isCredit ? '+' : ''}{formatCurrency(txn.amount)}
                      </span>
                    </div>
                  );
                })}
                {recentTransactions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent transactions</p>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Top-Up Trend Chart */}
          <Card className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />
                Top-Up Trend
              </CardTitle>
              <Select value={trendPeriod} onValueChange={(v) => setTrendPeriod(v as '7' | '14')}>
                <SelectTrigger className="w-[100px] h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="14">Last 14 days</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }} 
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }} 
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value}`}
                    className="text-muted-foreground"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAmount)"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* ============== Footer Section ============== */}
      <footer className="border-t pt-4 mt-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span>System Status: Operational</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link to="#" className="hover:text-foreground transition-colors">Data Policy</Link>
            <span>•</span>
            <span>© {new Date().getFullYear()} Ministry of Education. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </AdminLayout>
  );
};

export default AdminDashboard;