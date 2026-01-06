import React, { useState } from 'react';
import { FileText, Download, Calendar } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { getTransactions, getBatches, getAccountHolder, getEducationAccount } from '@/lib/dataStore';
import { formatCurrency, formatDateTime, formatDate } from '@/lib/data';

const ReportsPage: React.FC = () => {
  const transactions = useDataStore(getTransactions);
  const batches = useDataStore(getBatches);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const filteredTransactions = transactions.filter(txn => {
    if (!startDate && !endDate) return true;
    const txnDate = new Date(txn.createdAt);
    if (startDate && txnDate < new Date(startDate)) return false;
    if (endDate && txnDate > new Date(endDate + 'T23:59:59')) return false;
    return true;
  });

  const topUps = filteredTransactions.filter(t => t.type === 'top_up' && t.status === 'completed');
  const charges = filteredTransactions.filter(t => t.type === 'charge' && t.status === 'completed');

  const topUpSummary = {
    count: topUps.length,
    total: topUps.reduce((sum, t) => sum + t.amount, 0),
  };

  const chargeSummary = {
    count: charges.length,
    total: Math.abs(charges.reduce((sum, t) => sum + t.amount, 0)),
  };

  const handleExport = (type: string) => {
    toast({
      title: "Export Started",
      description: `Exporting ${type} report as CSV...`,
    });
  };

  return (
    <AdminLayout>
      <PageHeader 
        title="Reports" 
        description="View top-up and fee charge summaries"
      />

      {/* Date Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button variant="outline" onClick={() => { setStartDate(''); setEndDate(''); }}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="topups" className="space-y-6">
        <TabsList>
          <TabsTrigger value="topups">Top-up Summary</TabsTrigger>
          <TabsTrigger value="charges">Fee Charges Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="topups">
          <div className="grid gap-6 md:grid-cols-2 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Top-ups</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">{topUpSummary.count}</p>
                <p className="text-muted-foreground">transactions</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-success">{formatCurrency(topUpSummary.total)}</p>
                <p className="text-muted-foreground">credited to accounts</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Top-up Transactions</CardTitle>
                <CardDescription>Detailed list of all top-up transactions</CardDescription>
              </div>
              <Button variant="outline" onClick={() => handleExport('top-up')}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topUps.slice(0, 20).map(txn => {
                    const account = getEducationAccount(txn.accountId);
                    const holder = account ? getAccountHolder(account.holderId) : null;

                    return (
                      <TableRow key={txn.id}>
                        <TableCell>{formatDateTime(txn.createdAt)}</TableCell>
                        <TableCell className="font-mono text-sm">{txn.id}</TableCell>
                        <TableCell>
                          {holder ? `${holder.firstName} ${holder.lastName}` : txn.accountId}
                        </TableCell>
                        <TableCell>{txn.description}</TableCell>
                        <TableCell className="text-right font-semibold text-success">
                          +{formatCurrency(txn.amount)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{txn.reference}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charges">
          <div className="grid gap-6 md:grid-cols-2 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Charges</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">{chargeSummary.count}</p>
                <p className="text-muted-foreground">fee charges</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Amount</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-warning">{formatCurrency(chargeSummary.total)}</p>
                <p className="text-muted-foreground">charged for courses</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Charge Transactions</CardTitle>
                <CardDescription>Detailed list of all fee charge transactions</CardDescription>
              </div>
              <Button variant="outline" onClick={() => handleExport('charges')}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Course / Period</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {charges.slice(0, 20).map(txn => {
                    const account = getEducationAccount(txn.accountId);
                    const holder = account ? getAccountHolder(account.holderId) : null;

                    return (
                      <TableRow key={txn.id}>
                        <TableCell>{formatDateTime(txn.createdAt)}</TableCell>
                        <TableCell className="font-mono text-sm">{txn.id}</TableCell>
                        <TableCell>
                          {holder ? `${holder.firstName} ${holder.lastName}` : txn.accountId}
                        </TableCell>
                        <TableCell>
                          <span>{txn.description}</span>
                          {txn.period && (
                            <span className="block text-sm text-muted-foreground">{txn.period}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-destructive">
                          {formatCurrency(txn.amount)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default ReportsPage;
