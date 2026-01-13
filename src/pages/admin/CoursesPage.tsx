import React, { useState, useRef, useMemo } from 'react';
import { Plus, Edit, Users, Search, X, Upload, Download, DollarSign, Calendar as CalendarIcon, Eye, UserPlus } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { toast } from '@/hooks/use-toast';
import { useDataStore } from '@/hooks/useDataStore';
import { 
  getCourses, 
  getEnrolmentsByCourse, 
  addCourse, 
  updateCourse,
  getAccountHolders,
  getAccountHolder,
  addEnrolment,
  removeEnrolment,
  getTransactions,
  getEducationAccount,
  getEducationAccounts,
  getOutstandingCharges
} from '@/lib/dataStore';
import { formatCurrency, formatDateTime, PaymentType, BillingCycle, getStatusLabel } from '@/lib/data';
import { ProviderCombobox } from '@/components/ui/provider-combobox';

const BILLING_CYCLE_DURATIONS: Record<BillingCycle, number> = {
  monthly: 1,
  quarterly: 3,
  bi_annually: 6,
  annually: 12,
};

const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  bi_annually: 'Bi-annually (6 months)',
  annually: 'Annually',
};

// Course Details Content Component
interface CourseDetailsContentProps {
  course: ReturnType<typeof getCourses>[0];
  onEdit: () => void;
  onManageStudents: () => void;
  onRemoveStudent: (enrolmentId: string) => void;
  onClose: () => void;
}

const BILLING_CYCLE_LABELS_DETAIL: Record<string, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  bi_annually: 'Bi-annually',
  annually: 'Annually',
};

const CourseDetailsContent: React.FC<CourseDetailsContentProps> = ({ 
  course, 
  onEdit, 
  onManageStudents,
  onRemoveStudent,
  onClose 
}) => {
  const enrolments = getEnrolmentsByCourse(course.id);
  const activeEnrolments = enrolments.filter(e => e.isActive);
  const transactions = getTransactions();
  const educationAccounts = getEducationAccounts();
  const outstandingCharges = getOutstandingCharges();
  
  // Calculate course statistics
  const courseStats = useMemo(() => {
    // Total collected from transactions for this course
    const courseTransactions = transactions.filter(
      t => t.courseId === course.id && t.type === 'charge' && t.status === 'completed'
    );
    const totalCollected = Math.abs(courseTransactions.reduce((sum, t) => sum + t.amount, 0));
    
    // Outstanding amount for this course
    const courseOutstanding = outstandingCharges.filter(
      c => c.courseId === course.id && (c.status === 'unpaid' || c.status === 'overdue')
    );
    const totalOutstanding = courseOutstanding.reduce((sum, c) => sum + c.amount, 0);
    
    return {
      totalEnrolled: activeEnrolments.length,
      totalCollected,
      totalOutstanding,
    };
  }, [course.id, activeEnrolments, transactions, outstandingCharges]);
  
  // Get student list with account status and payment status
  const studentList = useMemo(() => {
    return activeEnrolments.map(enrolment => {
      const holder = getAccountHolder(enrolment.holderId);
      const account = educationAccounts.find(acc => acc.holderId === enrolment.holderId);
      
      // Check outstanding charges for this student and course
      const studentCharges = outstandingCharges.filter(
        c => c.courseId === course.id && c.accountId === account?.id
      );
      
      let paymentStatus: 'paid' | 'pending' | 'overdue' = 'paid';
      if (studentCharges.some(c => c.status === 'overdue')) {
        paymentStatus = 'overdue';
      } else if (studentCharges.some(c => c.status === 'unpaid')) {
        paymentStatus = 'pending';
      }
      
      return {
        enrolmentId: enrolment.id,
        holderId: enrolment.holderId,
        accountId: account?.id || '-',
        name: holder ? `${holder.firstName} ${holder.lastName}` : 'Unknown',
        accountStatus: account?.status || 'unknown',
        enrollmentDate: enrolment.startDate,
        paymentStatus,
      };
    });
  }, [activeEnrolments, course.id, educationAccounts, outstandingCharges]);
  
  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="success">Paid</Badge>;
      case 'pending':
        return <Badge variant="warning">Pending</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };
  
  const getAccountStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'suspended':
        return <Badge variant="warning">Suspended</Badge>;
      case 'closed':
        return <Badge variant="destructive">Closed</Badge>;
      case 'not_active':
        return <Badge variant="secondary">Not Active</Badge>;
      case 'pending_activation':
        return <Badge variant="outline">Pending Activation</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };
  
  return (
    <>
      <DialogHeader>
        <div className="flex items-start justify-between">
          <div>
            <Badge variant="secondary" className="mb-2">{course.code}</Badge>
            <DialogTitle className="text-xl">{course.name}</DialogTitle>
            <DialogDescription className="mt-1">
              {course.provider} • {course.paymentType === 'one_time' ? 'One-time' : 'Recurring'} Payment
            </DialogDescription>
          </div>
          <Badge variant={course.isActive ? 'active' : 'closed'}>
            {course.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </DialogHeader>
      
      {/* Course Configuration */}
      <div className="py-4 border-b">
        <Label className="text-base font-semibold mb-3 block">Course Configuration</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Fee</p>
            <p className="font-medium">{formatCurrency(course.monthlyFee)}{course.paymentType === 'recurring' ? '/period' : ''}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Payment Type</p>
            <p className="font-medium">{course.paymentType === 'one_time' ? 'One-time' : 'Recurring'}</p>
          </div>
          {course.paymentType === 'one_time' && course.paymentDeadlineDays && (
            <div>
              <p className="text-muted-foreground">Payment Deadline</p>
              <p className="font-medium">{course.paymentDeadlineDays} days</p>
            </div>
          )}
          {course.paymentType === 'recurring' && (
            <>
              <div>
                <p className="text-muted-foreground">Billing Cycle</p>
                <p className="font-medium">{course.billingCycle ? BILLING_CYCLE_LABELS_DETAIL[course.billingCycle] : '-'}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Billing Day</p>
                <p className="font-medium">{course.billingDay ? `Day ${course.billingDay}` : '-'}</p>
              </div>
            </>
          )}
          {course.startDate && (
            <div>
              <p className="text-muted-foreground">Start Date</p>
              <p className="font-medium">{course.startDate}</p>
            </div>
          )}
          {course.endDate && (
            <div>
              <p className="text-muted-foreground">End Date</p>
              <p className="font-medium">{course.endDate}</p>
            </div>
          )}
          {course.durationMonths && (
            <div>
              <p className="text-muted-foreground">Duration</p>
              <p className="font-medium">{course.durationMonths} month{course.durationMonths > 1 ? 's' : ''}</p>
            </div>
          )}
        </div>
        {course.description && (
          <div className="mt-3">
            <p className="text-muted-foreground text-sm">Description</p>
            <p className="text-sm">{course.description}</p>
          </div>
        )}
      </div>
      
      {/* Course Summary Stats */}
      <div className="grid grid-cols-3 gap-4 py-4">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold">{courseStats.totalEnrolled}</p>
            <p className="text-sm text-muted-foreground">Total Enrolled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-green-600">{formatCurrency(courseStats.totalCollected)}</p>
            <p className="text-sm text-muted-foreground">Total Collected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(courseStats.totalOutstanding)}</p>
            <p className="text-sm text-muted-foreground">Outstanding</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-2 pb-4">
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit className="h-4 w-4 mr-2" /> Edit Course
        </Button>
        <Button variant="outline" size="sm" onClick={onManageStudents}>
          <UserPlus className="h-4 w-4 mr-2" /> Add Students
        </Button>
      </div>
      
      {/* Student List Table */}
      <div className="space-y-2">
        <Label className="text-base font-semibold">Student List</Label>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Account ID</TableHead>
                <TableHead>Account Status</TableHead>
                <TableHead>Enrollment Date</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No students enrolled in this course
                  </TableCell>
                </TableRow>
              ) : (
                studentList.map(student => (
                  <TableRow key={student.enrolmentId}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell className="font-mono text-sm">{student.accountId}</TableCell>
                    <TableCell>{getAccountStatusBadge(student.accountStatus)}</TableCell>
                    <TableCell>{student.enrollmentDate}</TableCell>
                    <TableCell>{getPaymentStatusBadge(student.paymentStatus)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onRemoveStudent(student.enrolmentId)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <DialogFooter className="mt-4">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </DialogFooter>
    </>
  );
};

const CoursesPage: React.FC = () => {
  const courses = useDataStore(getCourses);
  const accountHolders = useDataStore(getAccountHolders);
  const transactions = useDataStore(getTransactions);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [manageStudentsDialogOpen, setManageStudentsDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<typeof courses[0] | null>(null);
  
  // Form states
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formProvider, setFormProvider] = useState('');
  const [formFee, setFormFee] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formPaymentType, setFormPaymentType] = useState<PaymentType>('recurring');
  const [formBillingCycle, setFormBillingCycle] = useState<BillingCycle>('monthly');
  const [formStartDate, setFormStartDate] = useState<Date | undefined>();
  const [formEndDate, setFormEndDate] = useState<Date | undefined>();
  const [formPaymentDeadlineDays, setFormPaymentDeadlineDays] = useState('30');
  const [formBillingDay, setFormBillingDay] = useState('1');
  
  // Student search states
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStudents = accountHolders.filter(holder => {
    const matchesSearch = 
      holder.firstName.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      holder.lastName.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      holder.id.toLowerCase().includes(studentSearchQuery.toLowerCase());
    return matchesSearch;
  });

  const resetForm = () => {
    setFormCode('');
    setFormName('');
    setFormProvider('');
    setFormFee('');
    setFormDescription('');
    setFormActive(true);
    setFormPaymentType('recurring');
    setFormBillingCycle('monthly');
    setFormStartDate(undefined);
    setFormEndDate(undefined);
    setFormPaymentDeadlineDays('30');
    setFormBillingDay('1');
  };

  const handleCreateCourse = () => {
    if (!formCode || !formName || !formProvider || !formFee || !formDescription) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Code, Name, Provider, Fee, Description).",
        variant: "destructive",
      });
      return;
    }

    // Calculate duration in months from start and end date if provided
    let durationMonths = 12; // Default to 12 months
    if (formStartDate && formEndDate) {
      const monthsDiff = (formEndDate.getFullYear() - formStartDate.getFullYear()) * 12 + (formEndDate.getMonth() - formStartDate.getMonth());
      durationMonths = Math.max(1, monthsDiff);
    }

    const newCourse = {
      id: `CRS${String(Date.now()).slice(-6)}`,
      code: formCode.toUpperCase(),
      name: formName,
      provider: formProvider,
      monthlyFee: parseFloat(formFee),
      description: formDescription,
      startDate: formStartDate ? formStartDate.toISOString().split('T')[0] : undefined,
      endDate: formEndDate ? formEndDate.toISOString().split('T')[0] : undefined,
      isActive: formActive,
      paymentType: formPaymentType,
      billingCycle: formPaymentType === 'recurring' ? formBillingCycle : undefined,
      durationMonths,
      paymentDeadlineDays: formPaymentType === 'one_time' ? parseInt(formPaymentDeadlineDays) : undefined,
      billingDay: formPaymentType === 'recurring' ? parseInt(formBillingDay) : undefined,
    };

    addCourse(newCourse);

    toast({
      title: "Course Created",
      description: `${formName} has been created successfully.`,
    });

    setCreateDialogOpen(false);
    resetForm();
  };

  const handleEditCourse = (course: typeof courses[0]) => {
    setSelectedCourse(course);
    setFormCode(course.code);
    setFormName(course.name);
    setFormProvider(course.provider || '');
    setFormFee(course.monthlyFee.toString());
    setFormDescription(course.description);
    setFormActive(course.isActive);
    setFormPaymentType(course.paymentType || 'recurring');
    setFormBillingCycle(course.billingCycle || 'monthly');
    setFormStartDate(course.startDate ? new Date(course.startDate) : undefined);
    setFormEndDate(course.endDate ? new Date(course.endDate) : undefined);
    setFormPaymentDeadlineDays(course.paymentDeadlineDays?.toString() || '30');
    setFormBillingDay(course.billingDay?.toString() || '1');
    setEditDialogOpen(true);
  };

  const handleViewDetails = (course: typeof courses[0]) => {
    setSelectedCourse(course);
    setDetailsDialogOpen(true);
  };

  const handleUpdateCourse = () => {
    if (!selectedCourse || !formCode || !formName || !formProvider || !formFee || !formDescription) return;

    let durationMonths = selectedCourse.durationMonths || 12;
    if (formStartDate && formEndDate) {
      const monthsDiff = (formEndDate.getFullYear() - formStartDate.getFullYear()) * 12 + (formEndDate.getMonth() - formStartDate.getMonth());
      durationMonths = Math.max(1, monthsDiff);
    }

    updateCourse(selectedCourse.id, {
      code: formCode.toUpperCase(),
      name: formName,
      provider: formProvider,
      monthlyFee: parseFloat(formFee),
      description: formDescription,
      isActive: formActive,
      paymentType: formPaymentType,
      billingCycle: formPaymentType === 'recurring' ? formBillingCycle : undefined,
      startDate: formStartDate ? formStartDate.toISOString().split('T')[0] : undefined,
      endDate: formEndDate ? formEndDate.toISOString().split('T')[0] : undefined,
      durationMonths,
      paymentDeadlineDays: formPaymentType === 'one_time' ? parseInt(formPaymentDeadlineDays) : undefined,
      billingDay: formPaymentType === 'recurring' ? parseInt(formBillingDay) : undefined,
    });

    toast({
      title: "Course Updated",
      description: `${formName} has been updated successfully.`,
    });

    setEditDialogOpen(false);
    setSelectedCourse(null);
    resetForm();
  };

  const handleManageStudents = (course: typeof courses[0]) => {
    setSelectedCourse(course);
    setStudentSearchQuery('');
    setSelectedStudentIds([]);
    setManageStudentsDialogOpen(true);
  };

  const handleSelectStudent = (holderId: string, checked: boolean) => {
    if (checked) {
      setSelectedStudentIds([...selectedStudentIds, holderId]);
    } else {
      setSelectedStudentIds(selectedStudentIds.filter(id => id !== holderId));
    }
  };

  const handleAddSelectedStudents = () => {
    if (!selectedCourse || selectedStudentIds.length === 0) return;

    let addedCount = 0;
    selectedStudentIds.forEach(holderId => {
      const enrolments = getEnrolmentsByCourse(selectedCourse.id);
      const existing = enrolments.find(e => e.holderId === holderId && e.isActive);

      if (!existing) {
        addEnrolment({
          id: `ENR${String(Date.now()).slice(-6)}${holderId}`,
          holderId: holderId,
          courseId: selectedCourse.id,
          startDate: new Date().toISOString().split('T')[0],
          endDate: null,
          isActive: true,
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      toast({
        title: "Students Enrolled",
        description: `${addedCount} student(s) enrolled in ${selectedCourse.name}.`,
      });
    }

    setSelectedStudentIds([]);
    setStudentSearchQuery('');
  };

  const handleRemoveStudent = (enrolmentId: string) => {
    removeEnrolment(enrolmentId);
    toast({
      title: "Student Removed",
      description: "Student has been removed from the course.",
    });
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Simulate file import
    toast({
      title: "Import Started",
      description: `Processing ${file.name}...`,
    });

    setTimeout(() => {
      toast({
        title: "Import Complete",
        description: "Course data has been imported successfully.",
      });
      setImportDialogOpen(false);
    }, 1500);
  };

  const CourseFormFields = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="code">Course Code *</Label>
          <Input 
            id="code" 
            placeholder="e.g., IT101" 
            value={formCode}
            onChange={(e) => setFormCode(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fee">Fee (SGD) *</Label>
          <Input 
            id="fee" 
            type="number" 
            placeholder="0.00"
            value={formFee}
            onChange={(e) => setFormFee(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Course Name *</Label>
        <Input 
          id="name" 
          placeholder="e.g., Introduction to Programming"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="provider">Provider (School/Institution) *</Label>
        <ProviderCombobox
          value={formProvider}
          onChange={setFormProvider}
          placeholder="Type to search providers..."
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea 
          id="description" 
          placeholder="Brief description of the course (required)"
          value={formDescription}
          onChange={(e) => setFormDescription(e.target.value)}
        />
      </div>

      {/* Start Date and End Date - Moved above Payment Type */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formStartDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formStartDate ? format(formStartDate, "PPP") : "Pick start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end" side="bottom">
              <Calendar
                mode="single"
                selected={formStartDate}
                onSelect={setFormStartDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label>End Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formEndDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formEndDate ? format(formEndDate, "PPP") : "Pick end date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end" side="bottom">
              <Calendar
                mode="single"
                selected={formEndDate}
                onSelect={setFormEndDate}
                disabled={(date) => formStartDate ? date < formStartDate : false}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {/* Payment Type */}
      <div className="space-y-2">
        <Label>Payment Type</Label>
        <Select value={formPaymentType} onValueChange={(v) => setFormPaymentType(v as PaymentType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="one_time">One-time Payment</SelectItem>
            <SelectItem value="recurring">Recurring Payment</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* One-time Payment: Payment Deadline (Days) */}
      {formPaymentType === 'one_time' && (
        <div className="space-y-2">
          <Label>Payment Deadline (Days)</Label>
          <Input 
            type="number" 
            min="1"
            max="365"
            placeholder="e.g., 30"
            value={formPaymentDeadlineDays}
            onChange={(e) => setFormPaymentDeadlineDays(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Number of days after enrollment to pay</p>
        </div>
      )}

      {/* Recurring Payment: Billing Cycle + Billing Day */}
      {formPaymentType === 'recurring' && (
        <>
          <div className="space-y-2">
            <Label>Billing Cycle</Label>
            <Select value={formBillingCycle} onValueChange={(v) => setFormBillingCycle(v as BillingCycle)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(BILLING_CYCLE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Billing Day (1-31)</Label>
            <Input 
              type="number" 
              min="1"
              max="31"
              placeholder="e.g., 1"
              value={formBillingDay}
              onChange={(e) => setFormBillingDay(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Day of the month when billing occurs</p>
          </div>
        </>
      )}

      <div className="flex items-center justify-between">
        <Label htmlFor="active">Active</Label>
        <Switch 
          id="active" 
          checked={formActive}
          onCheckedChange={setFormActive}
        />
      </div>
    </>
  );

  // Fee charges calculations
  const charges = transactions.filter(t => t.type === 'charge' && t.status === 'completed');
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
        title="All Courses" 
        description="Manage courses and enrolments"
      >
        <div className="flex gap-2">
          {/* Import Button */}
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Import Courses</DialogTitle>
                <DialogDescription>
                  Upload an Excel or CSV file to import courses
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div 
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="font-medium">Click to upload</p>
                  <p className="text-sm text-muted-foreground">or drag and drop</p>
                  <p className="text-xs text-muted-foreground mt-2">Excel (.xlsx) or CSV files</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleImportFile}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                  Cancel
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Course Button */}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add Course
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Course</DialogTitle>
                <DialogDescription>
                  Add a new course to the education account system.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <CourseFormFields />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCourse}>
                  Create Course
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Courses Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCourses.map((course) => {
          const enrolments = getEnrolmentsByCourse(course.id);
          const activeEnrolments = enrolments.filter(e => e.isActive);

          return (
            <Card key={course.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="secondary" className="mb-2">{course.code}</Badge>
                    <CardTitle className="text-lg">{course.name}</CardTitle>
                  </div>
                  <Badge variant={course.isActive ? 'active' : 'closed'}>
                    {course.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{course.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline">
                    {course.paymentType === 'one_time' ? 'One-time' : 'Recurring'}
                  </Badge>
                  {course.paymentType === 'recurring' && course.billingCycle && (
                    <Badge variant="outline">
                      {BILLING_CYCLE_LABELS[course.billingCycle]}
                    </Badge>
                  )}
                  {course.durationMonths && (
                    <Badge variant="outline">
                      {course.durationMonths} month{course.durationMonths > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{activeEnrolments.length} enrolled</span>
                  </div>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(course.monthlyFee)}
                    {course.paymentType === 'recurring' && '/mo'}
                  </span>
                </div>

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => handleViewDetails(course)}
                >
                  <Eye className="h-4 w-4 mr-2" /> View Details
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="mt-6 text-sm text-muted-foreground text-center">
        Showing {filteredCourses.length} of {courses.length} courses
      </p>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Update course details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <CourseFormFields />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateCourse}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Students Dialog - Compact */}
      <Dialog open={manageStudentsDialogOpen} onOpenChange={setManageStudentsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Students - {selectedCourse?.name}</DialogTitle>
            <DialogDescription>
              Search and add students to this course.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {/* Student Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or ID..."
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Selected Students */}
            {selectedStudentIds.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                {selectedStudentIds.map(id => {
                  const holder = getAccountHolder(id);
                  const account = getEducationAccounts().find(acc => acc.holderId === id);
                  return (
                    <Badge key={id} variant="secondary" className="pl-2 pr-1 py-1">
                      {holder ? `${holder.firstName} ${holder.lastName}` : id}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 ml-1 hover:bg-transparent"
                        onClick={() => handleSelectStudent(id, false)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  );
                })}
              </div>
            )}

            {/* Search Results */}
            {studentSearchQuery && (
              <div className="border rounded-lg max-h-48 overflow-y-auto">
                {filteredStudents
                  .filter(holder => {
                    // Exclude already enrolled students
                    const enrolments = selectedCourse ? getEnrolmentsByCourse(selectedCourse.id) : [];
                    return !enrolments.some(e => e.holderId === holder.id && e.isActive);
                  })
                  .slice(0, 10).map(holder => {
                    const isSelected = selectedStudentIds.includes(holder.id);
                    const account = getEducationAccounts().find(acc => acc.holderId === holder.id);
                    
                    return (
                      <div
                        key={holder.id}
                        className={`flex items-center justify-between p-2 cursor-pointer hover:bg-secondary/50 ${
                          isSelected ? 'bg-primary/10' : ''
                        }`}
                        onClick={() => handleSelectStudent(holder.id, !isSelected)}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox checked={isSelected} />
                          <div>
                            <p className="font-medium text-sm">{holder.firstName} {holder.lastName}</p>
                            <p className="text-xs text-muted-foreground font-mono">{account?.id || holder.id}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                {filteredStudents.filter(holder => {
                  const enrolments = selectedCourse ? getEnrolmentsByCourse(selectedCourse.id) : [];
                  return !enrolments.some(e => e.holderId === holder.id && e.isActive);
                }).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-3">No students found</p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageStudentsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddSelectedStudents} disabled={selectedStudentIds.length === 0}>
              <Plus className="h-4 w-4 mr-1" /> Enroll {selectedStudentIds.length > 0 ? `(${selectedStudentIds.length})` : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Course Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedCourse && (
            <CourseDetailsContent 
              course={selectedCourse}
              onEdit={() => {
                setDetailsDialogOpen(false);
                handleEditCourse(selectedCourse);
              }}
              onManageStudents={() => {
                setDetailsDialogOpen(false);
                handleManageStudents(selectedCourse);
              }}
              onRemoveStudent={(enrolmentId) => {
                handleRemoveStudent(enrolmentId);
              }}
              onClose={() => setDetailsDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default CoursesPage;