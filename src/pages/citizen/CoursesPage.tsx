import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  BookOpen, 
  Calendar, 
  CreditCard,
  Wallet,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { CitizenLayout } from '@/components/layouts/CitizenLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useDataStore } from '@/hooks/useDataStore';
import {
  getEducationAccountByHolder,
  getOutstandingChargesByAccount,
  getEnrolmentsByHolder,
  getCourse,
  updateEducationAccount,
  updateOutstandingCharge,
  addTransaction
} from '@/lib/dataStore';
import { formatCurrency, formatDate, OutstandingCharge } from '@/lib/data';
import { toast } from '@/hooks/use-toast';

type PaymentMethod = 'balance' | 'online' | 'combined';

const CoursesPage: React.FC = () => {
  const { citizenUser } = useAuth();
  
  const educationAccount = citizenUser ? getEducationAccountByHolder(citizenUser.id) : null;
  const outstandingCharges = educationAccount ? getOutstandingChargesByAccount(educationAccount.id) : [];
  const enrolments = citizenUser ? getEnrolmentsByHolder(citizenUser.id) : [];
  
  // Force re-render when data changes
  useDataStore(() => educationAccount);

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedCharges, setSelectedCharges] = useState<string[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('balance');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentResult, setPaymentResult] = useState<'success' | 'error' | null>(null);

  const activeEnrolments = enrolments.filter(e => e.isActive);
  const pendingCharges = outstandingCharges.filter(c => c.status === 'unpaid' || c.status === 'overdue');

  const selectedTotal = selectedCharges.reduce((sum, id) => {
    const charge = pendingCharges.find(c => c.id === id);
    return sum + (charge?.amount || 0);
  }, 0);

  const balance = educationAccount?.balance || 0;
  const canPayWithBalance = balance >= selectedTotal;
  const remainingAfterBalance = Math.max(0, selectedTotal - balance);

  const handleSelectCharge = (chargeId: string, checked: boolean) => {
    if (checked) {
      setSelectedCharges([...selectedCharges, chargeId]);
    } else {
      setSelectedCharges(selectedCharges.filter(id => id !== chargeId));
    }
  };

  const handlePayNow = (chargeId?: string) => {
    if (chargeId) {
      setSelectedCharges([chargeId]);
    }
    setPaymentDialogOpen(true);
    setPaymentResult(null);
  };

  const processPayment = () => {
    if (!educationAccount || selectedCharges.length === 0) return;

    setProcessingPayment(true);

    // Simulate payment processing
    setTimeout(() => {
      try {
        let balanceUsed = 0;
        let onlinePayment = 0;

        if (paymentMethod === 'balance') {
          if (!canPayWithBalance) {
            throw new Error('Insufficient balance');
          }
          balanceUsed = selectedTotal;
        } else if (paymentMethod === 'online') {
          onlinePayment = selectedTotal;
        } else if (paymentMethod === 'combined') {
          balanceUsed = Math.min(balance, selectedTotal);
          onlinePayment = remainingAfterBalance;
        }

        // Update account balance
        if (balanceUsed > 0) {
          updateEducationAccount(educationAccount.id, {
            balance: balance - balanceUsed
          });

          // Add transaction for balance payment
          addTransaction({
            id: `TXN${String(Date.now()).slice(-6)}`,
            accountId: educationAccount.id,
            type: 'payment',
            amount: -balanceUsed,
            balanceAfter: balance - balanceUsed,
            description: `Course Fee Payment (Balance)`,
            reference: `PAY-${Date.now()}`,
            status: 'completed',
            createdAt: new Date().toISOString(),
          });
        }

        if (onlinePayment > 0) {
          // Add transaction for online payment
          addTransaction({
            id: `TXN${String(Date.now()).slice(-6)}`,
            accountId: educationAccount.id,
            type: 'payment',
            amount: onlinePayment,
            balanceAfter: balance - balanceUsed,
            description: `Course Fee Payment (Online)`,
            reference: `PAY-ONLINE-${Date.now()}`,
            status: 'completed',
            createdAt: new Date().toISOString(),
          });
        }

        // Update outstanding charges to paid
        selectedCharges.forEach(chargeId => {
          updateOutstandingCharge(chargeId, { status: 'paid' });
        });

        setPaymentResult('success');
        toast({
          title: "Payment Successful",
          description: `Successfully paid ${formatCurrency(selectedTotal)}`,
        });
      } catch (error) {
        setPaymentResult('error');
        toast({
          title: "Payment Failed",
          description: "There was an error processing your payment. Please try again.",
          variant: "destructive",
        });
      } finally {
        setProcessingPayment(false);
      }
    }, 1500);
  };

  const closePaymentDialog = () => {
    setPaymentDialogOpen(false);
    setSelectedCharges([]);
    setPaymentMethod('balance');
    setPaymentResult(null);
  };

  return (
    <CitizenLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Courses</h1>
        <p className="text-muted-foreground">View your enrolled courses and pending payments</p>
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="details" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Course Details
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Pending Payments
            {pendingCharges.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {pendingCharges.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Course Details Tab */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Enrolled Courses</CardTitle>
              <CardDescription>All courses you are currently enrolled in</CardDescription>
            </CardHeader>
            <CardContent>
              {activeEnrolments.length > 0 ? (
                <div className="space-y-4">
                  {activeEnrolments.map((enrolment) => {
                    const course = getCourse(enrolment.courseId);
                    if (!course) return null;
                    
                    const charge = pendingCharges.find(c => c.courseId === course.id);
                    const hasPendingPayment = !!charge;

                    return (
                      <div
                        key={enrolment.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border gap-4"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                            <BookOpen className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{course.name}</h3>
                            <p className="text-sm text-muted-foreground">{course.code}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                Enrolled: {formatDate(enrolment.startDate)}
                              </span>
                              <span>{formatCurrency(course.monthlyFee)}/mo</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {hasPendingPayment ? (
                            <>
                              <Badge variant={charge?.status === 'overdue' ? 'destructive' : 'warning'}>
                                {charge?.status === 'overdue' ? 'Overdue' : 'Payment Due'}
                              </Badge>
                              <Button size="sm" onClick={() => handlePayNow(charge?.id)}>
                                Pay Now
                              </Button>
                            </>
                          ) : (
                            <Badge variant="success">Paid</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No courses enrolled</p>
                  <p className="text-sm">You are not currently enrolled in any courses</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-warning" />
                Pending Payments
              </CardTitle>
              <CardDescription>Select charges to pay</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingCharges.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12"></TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingCharges.map((charge) => (
                        <TableRow key={charge.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedCharges.includes(charge.id)}
                              onCheckedChange={(checked) => 
                                handleSelectCharge(charge.id, checked as boolean)
                              }
                            />
                          </TableCell>
                          <TableCell className="font-medium">{charge.courseName}</TableCell>
                          <TableCell>{charge.period}</TableCell>
                          <TableCell>{formatDate(charge.dueDate)}</TableCell>
                          <TableCell>
                            <Badge variant={charge.status === 'overdue' ? 'destructive' : 'warning'}>
                              {charge.status === 'overdue' ? 'Overdue' : 'Unpaid'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(charge.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {selectedCharges.length > 0 && (
                    <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {selectedCharges.length} item(s) selected
                        </p>
                        <p className="text-lg font-bold">
                          Total: {formatCurrency(selectedTotal)}
                        </p>
                      </div>
                      <Button onClick={() => handlePayNow()}>
                        Proceed to Payment
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-success opacity-70" />
                  <p className="font-medium">All payments up to date</p>
                  <p className="text-sm">You have no pending payments</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          {paymentResult === 'success' ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="h-6 w-6" />
                  Payment Successful
                </DialogTitle>
                <DialogDescription>
                  Your payment of {formatCurrency(selectedTotal)} has been processed successfully.
                </DialogDescription>
              </DialogHeader>
              <div className="py-6 text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mb-4">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Updated Balance: {formatCurrency(educationAccount?.balance || 0)}
                </p>
              </div>
              <DialogFooter>
                <Button onClick={closePaymentDialog} className="w-full">
                  Done
                </Button>
              </DialogFooter>
            </>
          ) : paymentResult === 'error' ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-6 w-6" />
                  Payment Failed
                </DialogTitle>
                <DialogDescription>
                  We couldn't process your payment. Please try again.
                </DialogDescription>
              </DialogHeader>
              <div className="py-6 text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-4">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
              </div>
              <DialogFooter className="flex gap-2">
                <Button variant="outline" onClick={closePaymentDialog} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={processPayment} className="flex-1">
                  Try Again
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Payment Method</DialogTitle>
                <DialogDescription>
                  Select how you would like to pay {formatCurrency(selectedTotal)}
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Your Balance</p>
                  <p className="text-xl font-bold">{formatCurrency(balance)}</p>
                </div>

                <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                  <div className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer ${
                    !canPayWithBalance ? 'opacity-50' : ''
                  }`}>
                    <RadioGroupItem value="balance" id="balance" disabled={!canPayWithBalance} />
                    <Label htmlFor="balance" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        <span className="font-medium">Pay with Balance</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Use your education account balance
                      </p>
                      {!canPayWithBalance && (
                        <p className="text-sm text-destructive mt-1">
                          Insufficient balance
                        </p>
                      )}
                    </Label>
                  </div>

                  <div className="flex items-start space-x-3 p-3 rounded-lg border cursor-pointer">
                    <RadioGroupItem value="online" id="online" />
                    <Label htmlFor="online" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        <span className="font-medium">Pay Online</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Credit/Debit card or e-payment
                      </p>
                    </Label>
                  </div>

                  <div className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer ${
                    balance <= 0 ? 'opacity-50' : ''
                  }`}>
                    <RadioGroupItem value="combined" id="combined" disabled={balance <= 0} />
                    <Label htmlFor="combined" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        <span className="font-medium">Combined Payment</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Use balance ({formatCurrency(Math.min(balance, selectedTotal))}) + pay remaining online ({formatCurrency(remainingAfterBalance)})
                      </p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closePaymentDialog}>
                  Cancel
                </Button>
                <Button onClick={processPayment} disabled={processingPayment}>
                  {processingPayment ? 'Processing...' : `Pay ${formatCurrency(selectedTotal)}`}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </CitizenLayout>
  );
};

export default CoursesPage;
