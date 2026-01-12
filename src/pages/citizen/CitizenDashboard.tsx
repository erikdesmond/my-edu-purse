import React from 'react';
import { Link } from 'react-router-dom';
import { Wallet, TrendingUp, CreditCard, ArrowRight, Receipt, Clock, BookOpen, Calendar, DollarSign } from 'lucide-react';
import { CitizenLayout } from '@/components/layouts/CitizenLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDataStore } from '@/hooks/useDataStore';
import {
  getEducationAccountByHolder,
  getTransactionsByAccount,
  getOutstandingChargesByAccount,
  getEnrolmentsByHolder,
  getCourse
} from '@/lib/dataStore';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/data';

const CitizenDashboard: React.FC = () => {
  const { user } = useAuth();
  
  // For demo, we'll use the first account holder that matches the email
  // In production, this would be fetched from the database based on auth user
  const allAccountHolders = getEducationAccountByHolder;
  const account = user ? getEducationAccountByHolder('AH001') : null; // Demo fallback
  
  // Force re-render when data changes
  useDataStore(() => account);
  
  const transactions = account ? getTransactionsByAccount(account.id).slice(0, 5) : [];
  const outstandingCharges = account ? getOutstandingChargesByAccount(account.id) : [];
  const enrolments = getEnrolmentsByHolder('AH001'); // Demo fallback
  const activeEnrolments = enrolments.filter(e => e.isActive);
  const totalOutstanding = outstandingCharges.filter(c => c.status === 'unpaid').reduce((sum, c) => sum + c.amount, 0);
  
  // Count paid courses
  const paidCoursesCount = activeEnrolments.filter(enrolment => {
    const hasUnpaidCharge = outstandingCharges.some(c => c.courseId === enrolment.courseId && c.status === 'unpaid');
    return !hasUnpaidCharge;
  }).length;

  if (!account) {
    return (
      <CitizenLayout>
        <div className="text-center py-16">
          <p>Account not found</p>
        </div>
      </CitizenLayout>
    );
  }

  return (
    <CitizenLayout>
      {/* Greeting */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          Welcome back!
        </h1>
        <p className="mt-1 text-muted-foreground">
          Your Education Account overview
        </p>
      </div>

      {/* Top Section: Stats Overview - 3 Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-6 animate-slide-up">
        {/* Current Balance Card */}
        <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                <Wallet className="h-5 w-5" />
              </div>
              <p className="text-sm opacity-90">Current Balance</p>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(account.balance)}</p>
            <p className="text-xs mt-2 opacity-75">
              Last top-up: {account.lastTopUpDate ? formatDate(account.lastTopUpDate) : 'N/A'}
            </p>
          </CardContent>
        </Card>

        {/* Pending Fees Card */}
        <Card className={totalOutstanding > 0 ? "border-warning bg-warning/5" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${totalOutstanding > 0 ? 'bg-warning/10' : 'bg-success/10'}`}>
                <DollarSign className={`h-5 w-5 ${totalOutstanding > 0 ? 'text-warning' : 'text-success'}`} />
              </div>
              <p className="text-sm text-muted-foreground">Pending Fees</p>
            </div>
            <p className={`text-3xl font-bold ${totalOutstanding > 0 ? 'text-warning' : 'text-success'}`}>
              {formatCurrency(totalOutstanding)}
            </p>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                {totalOutstanding > 0 
                  ? `${outstandingCharges.filter(c => c.status === 'unpaid').length} pending`
                  : 'All fees paid'
                }
              </p>
              {totalOutstanding > 0 && (
                <Button size="sm" variant="outline" asChild className="h-7 text-xs">
                  <Link to="/portal/courses">
                    <CreditCard className="h-3 w-3 mr-1" />
                    Pay
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Enrolled Courses Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-info/10">
                <BookOpen className="h-5 w-5 text-info" />
              </div>
              <p className="text-sm text-muted-foreground">Enrolled Courses</p>
            </div>
            <p className="text-3xl font-bold">{activeEnrolments.length}</p>
            <p className="text-xs mt-2 text-muted-foreground">
              {paidCoursesCount} paid
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Middle Section: Active Courses Table */}
      <Card className="mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Active Courses
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/portal/courses">
              View all <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {activeEnrolments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Monthly Fee</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeEnrolments.slice(0, 5).map((enrolment) => {
                  const course = getCourse(enrolment.courseId);
                  if (!course) return null;
                  const hasCharge = outstandingCharges.some(c => c.courseId === course.id && c.status === 'unpaid');
                  
                  return (
                    <TableRow key={enrolment.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                            <BookOpen className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{course.name}</p>
                            <p className="text-xs text-muted-foreground">{course.code}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(course.monthlyFee)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(enrolment.startDate)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {hasCharge ? (
                          <Badge variant="warning">Pending</Badge>
                        ) : (
                          <Badge variant="success">Paid</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No active courses</p>
              <p className="text-sm text-muted-foreground mt-1">Enroll in a course to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom Section: Recent Transactions */}
      <Card className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Transactions
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/portal/transactions">
              View all <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((txn) => (
                <div 
                  key={txn.id} 
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                      txn.type === 'top_up' ? 'bg-success/10' : 
                      txn.type === 'payment' ? 'bg-success/10' : 'bg-destructive/10'
                    }`}>
                      {txn.type === 'top_up' ? (
                        <TrendingUp className="h-5 w-5 text-success" />
                      ) : txn.type === 'payment' ? (
                        <CreditCard className="h-5 w-5 text-success" />
                      ) : (
                        <Receipt className="h-5 w-5 text-destructive" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{txn.description}</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(txn.createdAt)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      txn.type === 'top_up' || txn.type === 'payment' ? 'text-success' : 'text-destructive'
                    }`}>
                      {txn.type === 'top_up' ? '+' : txn.type === 'charge' ? '-' : ''}{formatCurrency(Math.abs(txn.amount))}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Bal: {formatCurrency(txn.balanceAfter)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">No transactions yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </CitizenLayout>
  );
};

export default CitizenDashboard;
