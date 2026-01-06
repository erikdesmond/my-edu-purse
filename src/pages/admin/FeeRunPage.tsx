import React, { useState } from 'react';
import { Play, Calendar, DollarSign } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { useDataStore } from '@/hooks/useDataStore';
import { 
  getEnrolments, 
  getCourses,
  getEducationAccounts,
  getAccountHolder,
  getCourse,
  getEducationAccountByHolder,
  addTransaction,
  updateEducationAccount,
  addBatch,
  addAuditLog,
  addOutstandingCharge,
} from '@/lib/dataStore';
import { formatCurrency, formatDateTime } from '@/lib/data';

const FeeRunPage: React.FC = () => {
  const enrolments = useDataStore(getEnrolments);
  const courses = useDataStore(getCourses);
  
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Get active enrolments with their details
  const activeEnrolments = enrolments
    .filter(e => e.isActive)
    .map(enrolment => {
      const holder = getAccountHolder(enrolment.holderId);
      const course = getCourse(enrolment.courseId);
      const account = getEducationAccountByHolder(enrolment.holderId);
      return { enrolment, holder, course, account };
    })
    .filter(item => item.holder && item.course && item.account);

  const totalCharges = activeEnrolments.reduce(
    (sum, item) => sum + (item.course?.monthlyFee || 0), 
    0
  );

  const handleRunFees = () => {
    if (!period) {
      toast({
        title: "Validation Error",
        description: "Please select a billing period.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    const [year, month] = period.split('-');
    const periodLabel = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-SG', {
      month: 'short',
      year: 'numeric'
    });

    // Create batch
    const batchId = `BAT${String(Date.now()).slice(-6)}`;
    addBatch({
      id: batchId,
      type: 'fee_run',
      description: `Monthly Fee Run - ${periodLabel}`,
      totalAmount: totalCharges,
      accountCount: activeEnrolments.length,
      status: 'completed',
      createdAt: new Date().toISOString(),
      createdBy: 'Admin User',
    });

    // Process each enrolment
    activeEnrolments.forEach(({ enrolment, holder, course, account }) => {
      if (!holder || !course || !account) return;

      const feeAmount = course.monthlyFee;
      const newBalance = account.balance - feeAmount;
      const transactionId = `TXN${String(Date.now()).slice(-6)}${enrolment.id}`;

      // Add charge transaction
      addTransaction({
        id: transactionId,
        accountId: account.id,
        type: 'charge',
        amount: -feeAmount,
        balanceAfter: newBalance,
        description: `Course Fee - ${course.code}`,
        reference: `FEE-${period.replace('-', '')}-${enrolment.id}`,
        status: 'completed',
        createdAt: new Date().toISOString(),
        courseId: course.id,
        period: periodLabel,
      });

      // Update account balance
      updateEducationAccount(account.id, {
        balance: newBalance,
      });

      // Add outstanding charge if balance is insufficient
      if (newBalance < 0) {
        addOutstandingCharge({
          id: `CHG${String(Date.now()).slice(-6)}${enrolment.id}`,
          accountId: account.id,
          courseId: course.id,
          courseName: course.name,
          period: periodLabel,
          amount: feeAmount,
          dueDate: new Date(parseInt(year), parseInt(month), 15).toISOString().split('T')[0],
          status: 'unpaid',
        });
      }
    });

    // Add audit log
    addAuditLog({
      id: `AUD${String(Date.now()).slice(-6)}`,
      action: 'Fee Run',
      entityType: 'Batch',
      entityId: batchId,
      userId: 'USR001',
      userName: 'Admin User',
      details: `Monthly fee run completed for ${periodLabel} - ${activeEnrolments.length} enrolments charged, total ${formatCurrency(totalCharges)}`,
      createdAt: new Date().toISOString(),
    });

    setIsProcessing(false);

    toast({
      title: "Fee Run Completed",
      description: `${activeEnrolments.length} course fees charged. Total: ${formatCurrency(totalCharges)}`,
    });
  };

  return (
    <AdminLayout>
      <PageHeader 
        title="Monthly Fee Run" 
        description="Calculate and post monthly course fees for all active enrolments"
      />

      <div className="grid gap-6 lg:grid-cols-3 mb-6">
        {/* Run Configuration */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Fee Run Configuration</CardTitle>
            <CardDescription>Set the billing period and review before running</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="period">Billing Period</Label>
                <Input
                  id="period"
                  type="month"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleRunFees}
                disabled={isProcessing || activeEnrolments.length === 0}
                size="lg"
              >
                <Play className="h-4 w-4 mr-2" />
                Run Monthly Fees
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-primary">{activeEnrolments.length}</p>
                <p className="text-sm text-muted-foreground">Active Enrolments</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-warning">{formatCurrency(totalCharges)}</p>
                <p className="text-sm text-muted-foreground">Total Charges</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-success">{courses.filter(c => c.isActive).length}</p>
                <p className="text-sm text-muted-foreground">Active Courses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Fee Summary by Course</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {courses.filter(c => c.isActive).map(course => {
              const courseEnrolments = activeEnrolments.filter(e => e.course?.id === course.id);
              if (courseEnrolments.length === 0) return null;

              return (
                <div key={course.id} className="flex justify-between items-center p-2 rounded-lg bg-muted/30">
                  <div>
                    <p className="font-medium text-sm">{course.code}</p>
                    <p className="text-xs text-muted-foreground">{courseEnrolments.length} students</p>
                  </div>
                  <p className="font-semibold">{formatCurrency(course.monthlyFee * courseEnrolments.length)}</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Enrolments Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Enrolments to be Charged</CardTitle>
          <CardDescription>Review all active enrolments that will be charged</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead className="text-right">Current Balance</TableHead>
                <TableHead className="text-right">Fee Amount</TableHead>
                <TableHead className="text-right">Balance After</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeEnrolments.slice(0, 20).map(({ enrolment, holder, course, account }) => {
                if (!holder || !course || !account) return null;
                const balanceAfter = account.balance - course.monthlyFee;

                return (
                  <TableRow key={enrolment.id}>
                    <TableCell className="font-medium">
                      {holder.firstName} {holder.lastName}
                    </TableCell>
                    <TableCell>
                      <span>{course.name}</span>
                      <span className="block text-sm text-muted-foreground">{course.code}</span>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(account.balance)}</TableCell>
                    <TableCell className="text-right text-destructive">
                      -{formatCurrency(course.monthlyFee)}
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${balanceAfter < 0 ? 'text-destructive' : ''}`}>
                      {formatCurrency(balanceAfter)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={balanceAfter >= 0 ? 'success' : 'warning'}>
                        {balanceAfter >= 0 ? 'Sufficient' : 'Insufficient'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {activeEnrolments.length > 20 && (
            <p className="text-sm text-muted-foreground text-center mt-4">
              Showing 20 of {activeEnrolments.length} enrolments
            </p>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default FeeRunPage;
