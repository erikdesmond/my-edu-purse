import React from 'react';
import { Link } from 'react-router-dom';
import { Wallet, TrendingUp, CreditCard, ArrowRight, Receipt, Clock } from 'lucide-react';
import { CitizenLayout } from '@/components/layouts/CitizenLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getEducationAccount,
  getTransactionsByAccount,
  getOutstandingChargesByAccount,
  formatCurrency,
  formatDate,
  formatDateTime
} from '@/lib/data';

const CitizenDashboard: React.FC = () => {
  const { citizenUser } = useAuth();
  const account = citizenUser ? getEducationAccount(citizenUser.accountId) : null;
  const transactions = account ? getTransactionsByAccount(account.id).slice(0, 5) : [];
  const outstandingCharges = account ? getOutstandingChargesByAccount(account.id) : [];
  const hasOutstanding = outstandingCharges.some(c => c.status === 'unpaid' || c.status === 'overdue');

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
          Hi, {citizenUser?.firstName}!
        </h1>
        <p className="mt-1 text-muted-foreground">
          Welcome back to your Education Account
        </p>
      </div>

      {/* Balance Card */}
      <Card className="mb-8 overflow-hidden animate-slide-up">
        <div className="bg-primary p-6 text-primary-foreground sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm opacity-90 mb-1">Current Balance</p>
              <p className="text-4xl font-bold sm:text-5xl">{formatCurrency(account.balance)}</p>
              <div className="flex items-center gap-4 mt-3 text-sm opacity-90">
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  Last top-up: {account.lastTopUpDate ? formatDate(account.lastTopUpDate) : 'N/A'}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              {hasOutstanding && (
                <Badge variant="warning" className="self-start sm:self-end">
                  Outstanding charges
                </Badge>
              )}
              <Button variant="secondary" size="lg" asChild className="mt-2">
                <Link to="/portal/payments">
                  <CreditCard className="h-4 w-4 mr-2" />
                  View & Pay
                </Link>
              </Button>
            </div>
          </div>
        </div>
        <CardContent className="p-4 bg-secondary/30">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Account ID: {account.id}</span>
            <Badge variant={account.status as any}>{account.status}</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Outstanding Charges Alert */}
      {outstandingCharges.length > 0 && (
        <Card className="mb-8 border-warning/50 bg-warning/5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/20">
                  <Receipt className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    You have {outstandingCharges.length} outstanding charge{outstandingCharges.length > 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Total: {formatCurrency(outstandingCharges.reduce((sum, c) => sum + c.amount, 0))}
                  </p>
                </div>
              </div>
              <Button variant="warning" size="sm" asChild>
                <Link to="/portal/payments">
                  Pay Now <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
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
                      txn.type === 'payment' ? 'bg-info/10' : 'bg-destructive/10'
                    }`}>
                      {txn.type === 'top_up' ? (
                        <TrendingUp className="h-5 w-5 text-success" />
                      ) : txn.type === 'payment' ? (
                        <CreditCard className="h-5 w-5 text-info" />
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
                    <p className={`font-semibold ${txn.amount > 0 ? 'text-success' : 'text-foreground'}`}>
                      {txn.amount > 0 ? '+' : ''}{formatCurrency(txn.amount)}
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
