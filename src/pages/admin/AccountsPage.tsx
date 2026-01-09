import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Eye, MoreHorizontal } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useDataStore } from '@/hooks/useDataStore';
import {
  getEducationAccounts,
  getAccountHolders,
  getAccountHolder,
  addAccountHolder,
  addEducationAccount,
  addAuditLog,
} from '@/lib/dataStore';
import {
  formatCurrency,
  formatDate,
  getStatusLabel,
  getSchoolingLabel,
  AccountStatus,
  SchoolingStatus
} from '@/lib/data';

const AccountsPage: React.FC = () => {
  const educationAccounts = useDataStore(getEducationAccounts);
  const accountHolders = useDataStore(getAccountHolders);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [schoolingFilter, setSchoolingFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [schoolingStatus, setSchoolingStatus] = useState<SchoolingStatus>('in_school');
  const [initialBalance, setInitialBalance] = useState('');

  const filteredAccounts = educationAccounts.filter(account => {
    const holder = getAccountHolder(account.holderId);
    if (!holder) return false;

    const matchesSearch = 
      holder.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      holder.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      holder.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || account.status === statusFilter;
    const matchesSchooling = schoolingFilter === 'all' || holder.schoolingStatus === schoolingFilter;

    return matchesSearch && matchesStatus && matchesSchooling;
  });

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setDateOfBirth('');
    setAddress('');
    setSchoolingStatus('in_school');
    setInitialBalance('');
  };

  const handleCreateAccount = () => {
    if (!firstName || !lastName || !email || !dateOfBirth) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Calculate age
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    // Create account holder
    const holderId = `AH${String(Date.now()).slice(-6)}`;
    const newHolder = {
      id: holderId,
      firstName,
      lastName,
      email,
      phone: phone || '',
      dateOfBirth,
      age,
      address: address || '',
      schoolingStatus,
      createdAt: new Date().toISOString().split('T')[0],
    };

    addAccountHolder(newHolder);

    // Create education account
    const accountId = `EA${String(Date.now()).slice(-6)}`;
    const balance = parseFloat(initialBalance) || 0;
    const newAccount = {
      id: accountId,
      holderId,
      balance,
      status: 'active' as AccountStatus,
      openedAt: new Date().toISOString().split('T')[0],
      closedAt: null,
      lastTopUpDate: balance > 0 ? new Date().toISOString().split('T')[0] : null,
    };

    addEducationAccount(newAccount);

    // Add audit log
    addAuditLog({
      id: `AUD${String(Date.now()).slice(-6)}`,
      action: 'Account Created',
      entityType: 'EducationAccount',
      entityId: accountId,
      userId: 'USR001',
      userName: 'Admin User',
      details: `New education account created for ${firstName} ${lastName}`,
      createdAt: new Date().toISOString(),
    });

    toast({
      title: "Account Created",
      description: `Education account for ${firstName} ${lastName} has been created successfully.`,
    });

    setCreateDialogOpen(false);
    resetForm();
  };

  return (
    <AdminLayout>
      <PageHeader 
        title="Education Accounts" 
        description="Manage all education accounts"
      >
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Create Account
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Account</DialogTitle>
              <DialogDescription>
                Create a new education account for an account holder.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input 
                    id="firstName" 
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input 
                    id="lastName" 
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input 
                  id="email" 
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone" 
                    placeholder="+65 9XXX XXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth *</Label>
                  <Input 
                    id="dob" 
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input 
                  id="address" 
                  placeholder="Full address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schooling">Schooling Status</Label>
                <Select value={schoolingStatus} onValueChange={(v) => setSchoolingStatus(v as SchoolingStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_school">In School</SelectItem>
                    <SelectItem value="graduated">Graduated</SelectItem>
                    <SelectItem value="deferred">Deferred</SelectItem>
                    <SelectItem value="dropped_out">Dropped Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAccount}>
                Create Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or account number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={schoolingFilter} onValueChange={setSchoolingFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Schooling Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="in_school">In School</SelectItem>
                  <SelectItem value="graduated">Graduated</SelectItem>
                  <SelectItem value="deferred">Deferred</SelectItem>
                  <SelectItem value="dropped_out">Dropped Out</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Accounts Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Holder</TableHead>
                <TableHead>Account ID</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Schooling Status</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Account Status</TableHead>
                <TableHead>Opened</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map((account) => {
                const holder = getAccountHolder(account.holderId);
                if (!holder) return null;

                return (
                  <TableRow key={account.id} className="group">
                    <TableCell>
                      <p className="font-medium">{holder.firstName} {holder.lastName}</p>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{account.id}</TableCell>
                    <TableCell>{holder.age}</TableCell>
                    <TableCell>
                      <span className="text-sm">{getSchoolingLabel(holder.schoolingStatus)}</span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(account.balance)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={account.status as any}>
                        {getStatusLabel(account.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(account.openedAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/accounts/${account.id}`}>
                              <Eye className="h-4 w-4 mr-2" /> View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link to="/admin/topups/single">Top-up Account</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Suspend Account</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="mt-4 text-sm text-muted-foreground text-center">
        Showing {filteredAccounts.length} of {educationAccounts.length} accounts
      </p>
    </AdminLayout>
  );
};

export default AccountsPage;