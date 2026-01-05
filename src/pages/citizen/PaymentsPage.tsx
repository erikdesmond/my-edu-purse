import React, { useState } from 'react';
import { CreditCard, Wallet, CheckCircle, ArrowRight, AlertCircle } from 'lucide-react';
import { CitizenLayout } from '@/components/layouts/CitizenLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getEducationAccount,
  getOutstandingChargesByAccount,
  formatCurrency,
  formatDate,
  OutstandingCharge
} from '@/lib/data';
import { toast } from '@/hooks/use-toast';

const PaymentsPage: React.FC = () => {
  const { citizenUser } = useAuth();
  const [selectedCharges, setSelectedCharges] = useState<string[]>([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'balance' | 'card' | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const account = citizenUser ? getEducationAccount(citizenUser.accountId) : null;
  const outstandingCharges = account ? getOutstandingChargesByAccount(account.id) : [];
  
  const selectedTotal = outstandingCharges
    .filter(c => selectedCharges.includes(c.id))
    .reduce((sum, c) => sum + c.amount, 0);

  const canPayWithBalance = account && account.balance >= selectedTotal;

  const toggleCharge = (chargeId: string) => {
    setSelectedCharges(prev => 
      prev.includes(chargeId) 
        ? prev.filter(id => id !== chargeId)
        : [...prev, chargeId]
    );
  };

  const selectAll = () => {
    if (selectedCharges.length === outstandingCharges.length) {
      setSelectedCharges([]);
    } else {
      setSelectedCharges(outstandingCharges.map(c => c.id));
    }
  };

  const handlePay = () => {
    if (paymentMethod === 'balance' && !canPayWithBalance) {
      toast({
        title: "Insufficient Balance",
        description: "Your account balance is not enough to cover the selected charges.",
        variant: "destructive"
      });
      return;
    }

    // Simulate payment
    setTimeout(() => {
      setPaymentSuccess(true);
    }, 1500);
  };

  const resetPayment = () => {
    setPaymentDialogOpen(false);
    setPaymentMethod(null);
    setPaymentSuccess(false);
    setSelectedCharges([]);
  };

  const getStatusBadge = (status: OutstandingCharge['status']) => {
    switch (status) {
      case 'paid':
        return <Badge variant="paid">Paid</Badge>;
      case 'unpaid':
        return <Badge variant="unpaid">Unpaid</Badge>;
      case 'overdue':
        return <Badge variant="overdue">Overdue</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <CitizenLayout>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Payments</h1>
        <p className="mt-1 text-muted-foreground">
          View and pay your outstanding course fees
        </p>
      </div>

      {/* Balance Info */}
      <Card className="mb-6 animate-slide-up">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available Balance</p>
                <p className="text-2xl font-bold text-foreground">{account && formatCurrency(account.balance)}</p>
              </div>
            </div>
            {selectedCharges.length > 0 && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Selected Total</p>
                <p className="text-xl font-bold text-foreground">{formatCurrency(selectedTotal)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Outstanding Charges */}
      <Card className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Outstanding Charges</CardTitle>
              <CardDescription>Select charges to pay</CardDescription>
            </div>
            {outstandingCharges.length > 0 && (
              <Button variant="outline" size="sm" onClick={selectAll}>
                {selectedCharges.length === outstandingCharges.length ? 'Deselect All' : 'Select All'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {outstandingCharges.length > 0 ? (
            <>
              <div className="space-y-3 mb-6">
                {outstandingCharges.map((charge) => (
                  <div 
                    key={charge.id} 
                    className={`flex items-center gap-4 rounded-lg border p-4 transition-colors cursor-pointer ${
                      selectedCharges.includes(charge.id) ? 'border-primary bg-primary/5' : 'hover:bg-secondary/50'
                    }`}
                    onClick={() => toggleCharge(charge.id)}
                  >
                    <Checkbox 
                      checked={selectedCharges.includes(charge.id)}
                      onCheckedChange={() => toggleCharge(charge.id)}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{charge.courseName}</p>
                      <p className="text-sm text-muted-foreground">
                        {charge.period} • Due: {formatDate(charge.dueDate)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(charge.status)}
                      <span className="font-semibold text-lg">{formatCurrency(charge.amount)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <Button 
                className="w-full" 
                size="lg"
                disabled={selectedCharges.length === 0}
                onClick={() => setPaymentDialogOpen(true)}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Pay {selectedCharges.length > 0 && formatCurrency(selectedTotal)}
              </Button>
            </>
          ) : (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto text-success mb-3" />
              <p className="font-medium text-foreground">All paid up!</p>
              <p className="text-sm text-muted-foreground mt-1">
                You have no outstanding charges
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          {!paymentSuccess ? (
            <>
              <DialogHeader>
                <DialogTitle>Choose Payment Method</DialogTitle>
                <DialogDescription>
                  Pay {formatCurrency(selectedTotal)} for {selectedCharges.length} charge{selectedCharges.length > 1 ? 's' : ''}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-3 py-4">
                {/* Pay with Balance */}
                <div 
                  className={`flex items-center gap-4 rounded-lg border p-4 cursor-pointer transition-colors ${
                    paymentMethod === 'balance' ? 'border-primary bg-primary/5' : 'hover:bg-secondary/50'
                  } ${!canPayWithBalance ? 'opacity-50' : ''}`}
                  onClick={() => canPayWithBalance && setPaymentMethod('balance')}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Education Account Balance</p>
                    <p className="text-sm text-muted-foreground">
                      Available: {account && formatCurrency(account.balance)}
                    </p>
                  </div>
                  {!canPayWithBalance && (
                    <Badge variant="destructive">Insufficient</Badge>
                  )}
                </div>

                {/* Pay with Card */}
                <div 
                  className={`flex items-center gap-4 rounded-lg border p-4 cursor-pointer transition-colors ${
                    paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'hover:bg-secondary/50'
                  }`}
                  onClick={() => setPaymentMethod('card')}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-info/10">
                    <CreditCard className="h-5 w-5 text-info" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Credit/Debit Card</p>
                    <p className="text-sm text-muted-foreground">Pay with card or PayNow</p>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handlePay} disabled={!paymentMethod}>
                  Continue <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-success" />
              </div>
              <DialogTitle className="mb-2">Payment Successful!</DialogTitle>
              <DialogDescription>
                Your payment of {formatCurrency(selectedTotal)} has been processed successfully.
              </DialogDescription>
              <Button className="mt-6" onClick={resetPayment}>
                Done
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </CitizenLayout>
  );
};

export default PaymentsPage;
