import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Eye, MoreHorizontal, CheckCircle, XCircle, Download } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';
import { useDataStore } from '@/hooks/useDataStore';
import {
  getEducationAccounts,
  getAccountHolders,
  getAccountHolder,
  addAccountHolder,
  addEducationAccount,
  updateEducationAccount,
  addAuditLog,
} from '@/lib/dataStore';
import {
  formatCurrency,
  formatDate,
  getStatusLabel,
  getSchoolingLabel,
  AccountStatus,
  SchoolingStatus,
  AccountActivationStatus
} from '@/lib/data';

const AccountsPage: React.FC = () => {
  const educationAccounts = useDataStore(getEducationAccounts);
  const accountHolders = useDataStore(getAccountHolders);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  // Form states
  const [nricInput, setNricInput] = useState('');
  const [isNricRetrieved, setIsNricRetrieved] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [address, setAddress] = useState('');
  const [educationProvider, setEducationProvider] = useState('');
  const [schoolingStatus, setSchoolingStatus] = useState<SchoolingStatus>('in_school');
  const [activationStatus, setActivationStatus] = useState<AccountActivationStatus>('active_immediately');
  const [scheduledActivationDate, setScheduledActivationDate] = useState<Date | undefined>();
  const [initialBalance, setInitialBalance] = useState('');

  // Helper function to mask NRIC (show only last 4 characters)
  const maskNric = (nric: string) => {
    if (!nric || nric.length < 4) return 'N/A';
    return '****' + nric.slice(-4);
  };

  // Sort accounts by newest first (by openedAt date)
  const sortedAccounts = [...educationAccounts].sort((a, b) => 
    new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime()
  );

  const filteredAccounts = sortedAccounts.filter(account => {
    const holder = getAccountHolder(account.holderId);
    if (!holder) return false;

    const matchesSearch = 
      holder.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      holder.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      holder.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || account.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleSuspendAccount = (accountId: string) => {
    updateEducationAccount(accountId, { 
      status: 'suspended',
      suspendedAt: new Date().toISOString().split('T')[0]
    });
    addAuditLog({
      id: `AUD${String(Date.now()).slice(-6)}`,
      action: 'Account Suspended',
      entityType: 'EducationAccount',
      entityId: accountId,
      userId: 'USR001',
      userName: 'Admin User',
      details: `Account ${accountId} has been suspended`,
      createdAt: new Date().toISOString(),
    });
    toast({
      title: "Account Suspended",
      description: `Account ${accountId} has been suspended.`,
      variant: "destructive"
    });
  };

  const handleReactivateAccount = (accountId: string) => {
    updateEducationAccount(accountId, { 
      status: 'active',
      suspendedAt: null
    });
    addAuditLog({
      id: `AUD${String(Date.now()).slice(-6)}`,
      action: 'Account Reactivated',
      entityType: 'EducationAccount',
      entityId: accountId,
      userId: 'USR001',
      userName: 'Admin User',
      details: `Account ${accountId} has been reactivated`,
      createdAt: new Date().toISOString(),
    });
    toast({
      title: "Account Reactivated",
      description: `Account ${accountId} has been reactivated.`,
    });
  };

  const resetForm = () => {
    setNricInput('');
    setIsNricRetrieved(false);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setDateOfBirth('');
    setAddress('');
    setEducationProvider('');
    setSchoolingStatus('in_school');
    setActivationStatus('active_immediately');
    setScheduledActivationDate(undefined);
    setInitialBalance('');
  };

  // Simulate NRIC data retrieval
  const handleRetrieveNric = () => {
    if (!nricInput || nricInput.length < 9) {
      toast({
        title: "Invalid NRIC",
        description: "Please enter a valid NRIC number (9 characters).",
        variant: "destructive",
      });
      return;
    }

    // Simulate API call to retrieve person data based on NRIC
    // In production, this would call a real backend API
    const mockData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+65 9123 4567',
      dateOfBirth: '1995-05-15',
      address: '123 Example Street, Singapore 123456',
      educationProvider: 'Singapore Polytechnic',
      schoolingStatus: 'in_school' as SchoolingStatus,
    };

    setFirstName(mockData.firstName);
    setLastName(mockData.lastName);
    setEmail(mockData.email);
    setPhone(mockData.phone);
    setDateOfBirth(mockData.dateOfBirth);
    setAddress(mockData.address);
    setEducationProvider(mockData.educationProvider);
    setSchoolingStatus(mockData.schoolingStatus);
    setIsNricRetrieved(true);

    toast({
      title: "Data Retrieved",
      description: "Personal information has been retrieved successfully.",
    });
  };

  const handleCreateAccount = () => {
    if (!nricInput || !firstName || !lastName || !email || !dateOfBirth || !educationProvider) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields including NRIC and Education Provider.",
        variant: "destructive",
      });
      return;
    }

    if (activationStatus === 'scheduled' && !scheduledActivationDate) {
      toast({
        title: "Validation Error",
        description: "Please select a scheduled activation date.",
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
      nric: nricInput,
      email,
      phone: phone || '',
      dateOfBirth,
      age,
      address: address || '',
      educationProvider,
      schoolingStatus,
      createdAt: new Date().toISOString().split('T')[0],
    };

    addAccountHolder(newHolder);

    // Determine account status based on activation setting
    let accountStatus: AccountStatus = 'pending';
    if (activationStatus === 'active_immediately') {
      accountStatus = 'active';
    }

    // Create education account
    const accountId = `EA${String(Date.now()).slice(-6)}`;
    const balance = parseFloat(initialBalance) || 0;
    const newAccount = {
      id: accountId,
      holderId,
      balance,
      status: accountStatus,
      activationStatus,
      scheduledActivationDate: activationStatus === 'scheduled' && scheduledActivationDate 
        ? scheduledActivationDate.toISOString().split('T')[0] 
        : null,
      openedAt: new Date().toISOString().split('T')[0],
      suspendedAt: null,
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
      details: `New education account created for ${firstName} ${lastName} (${educationProvider})${activationStatus === 'scheduled' ? ` - Scheduled for activation on ${format(scheduledActivationDate!, 'PPP')}` : ''}`,
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
              {/* NRIC Input with Retrieve Button */}
              <div className="space-y-2">
                <Label htmlFor="nric">NRIC Number *</Label>
                <div className="flex gap-2">
                  <Input 
                    id="nric" 
                    placeholder="e.g., S1234567A"
                    value={nricInput}
                    onChange={(e) => {
                      setNricInput(e.target.value.toUpperCase());
                      setIsNricRetrieved(false);
                    }}
                    className="flex-1"
                    maxLength={9}
                  />
                  <Button type="button" onClick={handleRetrieveNric} variant="secondary">
                    <Download className="h-4 w-4 mr-2" />
                    Retrieve
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the NRIC and click Retrieve to fetch personal data
                </p>
              </div>

              {isNricRetrieved && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input 
                        id="firstName" 
                        placeholder="First name"
                        value={firstName}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input 
                        id="lastName" 
                        placeholder="Last name"
                        value={lastName}
                        readOnly
                        className="bg-muted"
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
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input 
                        id="phone" 
                        placeholder="+65 9XXX XXXX"
                        value={phone}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dob">Date of Birth *</Label>
                      <Input 
                        id="dob" 
                        type="date"
                        value={dateOfBirth}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input 
                      id="address" 
                      placeholder="Full address"
                      value={address}
                      readOnly
                      className="bg-muted"
                    />
                  </div>

                  {/* Education Provider - Auto-populated from retrieve */}
                  <div className="space-y-2">
                    <Label htmlFor="educationProvider">Education Provider (School/Institution) *</Label>
                    <Input 
                      id="educationProvider" 
                      placeholder="e.g., Singapore Polytechnic"
                      value={educationProvider}
                      readOnly
                      className="bg-muted"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="schooling">Schooling Status</Label>
                    <Input 
                      id="schooling" 
                      value={schoolingStatus === 'in_school' ? 'In School' : 'Not In School'}
                      readOnly
                      className="bg-muted"
                    />
                  </div>

                  {/* Account Status Selection */}
                  <div className="space-y-3">
                    <Label>Account Status *</Label>
                    <RadioGroup 
                      value={activationStatus} 
                      onValueChange={(v) => setActivationStatus(v as AccountActivationStatus)}
                      className="space-y-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="non_active" id="non_active" />
                        <Label htmlFor="non_active" className="font-normal">Non-active</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="active_immediately" id="active_immediately" />
                        <Label htmlFor="active_immediately" className="font-normal">Active Immediately</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="scheduled" id="scheduled" />
                        <Label htmlFor="scheduled" className="font-normal">Schedule for Activation</Label>
                      </div>
                    </RadioGroup>

                    {activationStatus === 'scheduled' && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !scheduledActivationDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {scheduledActivationDate ? format(scheduledActivationDate, "PPP") : "Pick activation date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={scheduledActivationDate}
                            onSelect={setScheduledActivationDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAccount} disabled={!isNricRetrieved}>
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
                <TableHead>NRIC</TableHead>
                <TableHead>Age</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Account Status</TableHead>
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
                    <TableCell className="font-mono text-sm">{maskNric(holder.nric)}</TableCell>
                    <TableCell>{holder.age}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(account.balance)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={account.status as any}>
                        {getStatusLabel(account.status)}
                      </Badge>
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
                            <Link to="/admin/topup-management">Top-up Account</Link>
                          </DropdownMenuItem>
                          {account.status === 'suspended' ? (
                            <DropdownMenuItem onClick={() => handleReactivateAccount(account.id)}>
                              <CheckCircle className="h-4 w-4 mr-2" /> Re-activate Account
                            </DropdownMenuItem>
                          ) : account.status === 'active' ? (
                            <DropdownMenuItem className="text-destructive" onClick={() => handleSuspendAccount(account.id)}>
                              <XCircle className="h-4 w-4 mr-2" /> Suspend Account
                            </DropdownMenuItem>
                          ) : null}
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