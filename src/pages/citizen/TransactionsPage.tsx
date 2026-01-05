import React, { useState } from 'react';
import { TrendingUp, CreditCard, Receipt, Filter } from 'lucide-react';
import { CitizenLayout } from '@/components/layouts/CitizenLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getEducationAccount,
  getTransactionsByAccount,
  formatCurrency,
  formatDateTime,
  TransactionType
} from '@/lib/data';

const TransactionsPage: React.FC = () => {
  const { citizenUser } = useAuth();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  const account = citizenUser ? getEducationAccount(citizenUser.accountId) : null;
  const allTransactions = account ? getTransactionsByAccount(account.id) : [];
  
  const filteredTransactions = allTransactions.filter(txn => 
    typeFilter === 'all' || txn.type === typeFilter
  );

  const getTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'top_up':
        return <TrendingUp className="h-5 w-5 text-success" />;
      case 'payment':
        return <CreditCard className="h-5 w-5 text-info" />;
      case 'charge':
        return <Receipt className="h-5 w-5 text-destructive" />;
    }
  };

  const getTypeBadge = (type: TransactionType) => {
    switch (type) {
      case 'top_up':
        return <Badge variant="success">Top-up</Badge>;
      case 'payment':
        return <Badge variant="info">Payment</Badge>;
      case 'charge':
        return <Badge variant="secondary">Charge</Badge>;
    }
  };

  return (
    <CitizenLayout>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Transaction History</h1>
        <p className="mt-1 text-muted-foreground">
          View all your account transactions
        </p>
      </div>

      {/* Filter */}
      <Card className="mb-6 animate-slide-up">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="top_up">Top-ups</SelectItem>
                <SelectItem value="charge">Charges</SelectItem>
                <SelectItem value="payment">Payments</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <CardHeader>
          <CardTitle className="text-lg">
            {filteredTransactions.length} Transaction{filteredTransactions.length !== 1 ? 's' : ''}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length > 0 ? (
            <div className="space-y-3">
              {filteredTransactions.map((txn) => (
                <div 
                  key={txn.id} 
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-secondary/50"
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                      txn.type === 'top_up' ? 'bg-success/10' : 
                      txn.type === 'payment' ? 'bg-info/10' : 'bg-muted'
                    }`}>
                      {getTypeIcon(txn.type)}
                    </div>
                    <div>
                      <p className="font-medium">{txn.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">{formatDateTime(txn.createdAt)}</span>
                        {getTypeBadge(txn.type)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-semibold ${txn.amount > 0 ? 'text-success' : 'text-foreground'}`}>
                      {txn.amount > 0 ? '+' : ''}{formatCurrency(txn.amount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Balance: {formatCurrency(txn.balanceAfter)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="font-medium text-foreground">No transactions found</p>
              <p className="text-sm text-muted-foreground mt-1">
                {typeFilter !== 'all' ? 'Try changing the filter' : 'Your transactions will appear here'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </CitizenLayout>
  );
};

export default TransactionsPage;
