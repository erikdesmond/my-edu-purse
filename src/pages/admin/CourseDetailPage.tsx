import React, { useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, UserPlus, X, Search, Download, Upload } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';
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
  updateCourse,
  getAccountHolders,
  getAccountHolder,
  addEnrolment,
  removeEnrolment,
  getTransactions,
  getEducationAccounts,
  getOutstandingCharges
} from '@/lib/dataStore';
import { formatCurrency, PaymentType, BillingCycle } from '@/lib/data';
import { ProviderCombobox } from '@/components/ui/provider-combobox';

const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  bi_annually: 'Bi-annually',
  annually: 'Annually',
};

const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  
  const courses = useDataStore(getCourses);
  const accountHolders = useDataStore(getAccountHolders);
  const transactions = useDataStore(getTransactions);
  const educationAccounts = useDataStore(getEducationAccounts);
  const outstandingCharges = useDataStore(getOutstandingCharges);
  
  const course = courses.find(c => c.id === courseId);
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [manageStudentsDialogOpen, setManageStudentsDialogOpen] = useState(false);
  
  // Form states for editing
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
  
  // Student search states
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  
  if (!course) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-lg text-muted-foreground">Course not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/admin/courses')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Courses
          </Button>
        </div>
      </AdminLayout>
    );
  }
  
  const enrolments = getEnrolmentsByCourse(course.id);
  const activeEnrolments = enrolments.filter(e => e.isActive);
  
  // Calculate course statistics
  const courseStats = useMemo(() => {
    const courseTransactions = transactions.filter(
      t => t.courseId === course.id && t.type === 'charge' && t.status === 'completed'
    );
    const totalCollected = Math.abs(courseTransactions.reduce((sum, t) => sum + t.amount, 0));
    
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
  
  const filteredStudents = accountHolders.filter(holder => {
    const matchesSearch = 
      holder.firstName.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      holder.lastName.toLowerCase().includes(studentSearchQuery.toLowerCase()) ||
      holder.id.toLowerCase().includes(studentSearchQuery.toLowerCase());
    return matchesSearch;
  });
  
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
  
  const handleOpenEditDialog = () => {
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
    setEditDialogOpen(true);
  };
  
  const handleUpdateCourse = () => {
    if (!formCode || !formName || !formProvider || !formFee || !formDescription) return;

    let durationMonths = course.durationMonths || 12;
    if (formStartDate && formEndDate) {
      const monthsDiff = (formEndDate.getFullYear() - formStartDate.getFullYear()) * 12 + (formEndDate.getMonth() - formStartDate.getMonth());
      durationMonths = Math.max(1, monthsDiff);
    }

    updateCourse(course.id, {
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
    });

    toast({
      title: "Course Updated",
      description: `${formName} has been updated successfully.`,
    });

    setEditDialogOpen(false);
  };
  
  const handleOpenAddStudents = () => {
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
    if (selectedStudentIds.length === 0) return;

    let addedCount = 0;
    selectedStudentIds.forEach(holderId => {
      const existingEnrolments = getEnrolmentsByCourse(course.id);
      const existing = existingEnrolments.find(e => e.holderId === holderId && e.isActive);

      if (!existing) {
        addEnrolment({
          id: `ENR${String(Date.now()).slice(-6)}${holderId}`,
          holderId: holderId,
          courseId: course.id,
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
        description: `${addedCount} student(s) enrolled in ${course.name}.`,
      });
    }

    setSelectedStudentIds([]);
    setStudentSearchQuery('');
    setManageStudentsDialogOpen(false);
  };
  
  const handleRemoveStudent = (enrolmentId: string) => {
    removeEnrolment(enrolmentId);
    toast({
      title: "Student Removed",
      description: "Student has been removed from the course.",
    });
  };
  
  // Get enrolled student IDs for filtering
  const enrolledStudentIds = activeEnrolments.map(e => e.holderId);
  const availableStudents = filteredStudents.filter(h => !enrolledStudentIds.includes(h.id));
  
  return (
    <AdminLayout>
      <PageHeader 
        title={course.name}
        description={`${course.provider} • ${course.paymentType === 'one_time' ? 'One-time' : 'Recurring'} Payment`}
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/admin/courses')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <Badge variant={course.isActive ? 'active' : 'closed'} className="ml-2">
            {course.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </PageHeader>
      
      {/* Course Code Badge */}
      <div className="mb-4">
        <Badge variant="secondary" className="text-sm">{course.code}</Badge>
      </div>
      
      {/* Course Configuration */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <Label className="text-base font-semibold mb-4 block">Course Configuration</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            <div>
              <p className="text-muted-foreground">Fee</p>
              <p className="font-medium text-lg">{formatCurrency(course.monthlyFee)}{course.paymentType === 'recurring' ? '/period' : ''}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Payment Type</p>
              <p className="font-medium">{course.paymentType === 'one_time' ? 'One-time' : 'Recurring'}</p>
            </div>
            {course.paymentType === 'recurring' && (
              <div>
                <p className="text-muted-foreground">Billing Cycle</p>
                <p className="font-medium">{course.billingCycle ? BILLING_CYCLE_LABELS[course.billingCycle] : '-'}</p>
              </div>
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
            <div className="mt-4 pt-4 border-t">
              <p className="text-muted-foreground text-sm mb-1">Description</p>
              <p className="text-sm">{course.description}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Course Summary Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-3xl font-bold">{courseStats.totalEnrolled}</p>
            <p className="text-sm text-muted-foreground">Total Enrolled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-3xl font-bold text-green-600">{formatCurrency(courseStats.totalCollected)}</p>
            <p className="text-sm text-muted-foreground">Total Collected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-3xl font-bold text-amber-600">{formatCurrency(courseStats.totalOutstanding)}</p>
            <p className="text-sm text-muted-foreground">Outstanding</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-2 mb-6">
        <Button variant="outline" onClick={handleOpenEditDialog}>
          <Edit className="h-4 w-4 mr-2" /> Edit Course
        </Button>
        <Button variant="outline" onClick={handleOpenAddStudents}>
          <UserPlus className="h-4 w-4 mr-2" /> Add Students
        </Button>
      </div>
      
      {/* Student List Table */}
      <Card>
        <CardContent className="pt-6">
          <Label className="text-base font-semibold mb-4 block">Student List</Label>
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
                          onClick={() => handleRemoveStudent(student.enrolmentId)}
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
        </CardContent>
      </Card>
      
      {/* Edit Course Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>
              Update course details and settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-code">Course Code *</Label>
                <Input 
                  id="edit-code" 
                  placeholder="e.g., IT101" 
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-fee">Fee (SGD) *</Label>
                <Input 
                  id="edit-fee" 
                  type="number" 
                  placeholder="0.00"
                  value={formFee}
                  onChange={(e) => setFormFee(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Course Name *</Label>
              <Input 
                id="edit-name" 
                placeholder="e.g., Introduction to Programming"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-provider">Provider (School/Institution) *</Label>
              <ProviderCombobox
                value={formProvider}
                onChange={setFormProvider}
                placeholder="Type to search providers..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description *</Label>
              <Textarea 
                id="edit-description" 
                placeholder="Brief description of the course (required)"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>

            {/* Start Date and End Date */}
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
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formStartDate}
                      onSelect={setFormStartDate}
                      initialFocus
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
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formEndDate}
                      onSelect={setFormEndDate}
                      disabled={(date) => formStartDate ? date < formStartDate : false}
                      initialFocus
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

            {/* Recurring Payment: Billing Cycle */}
            {formPaymentType === 'recurring' && (
              <div className="space-y-2">
                <Label>Billing Cycle</Label>
                <Select value={formBillingCycle} onValueChange={(v) => setFormBillingCycle(v as BillingCycle)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="bi_annually">Bi-annually (6 months)</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <Switch 
                checked={formActive} 
                onCheckedChange={setFormActive}
              />
              <Label>Course is active</Label>
            </div>
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
      
      {/* Add Students Dialog */}
      <Dialog open={manageStudentsDialogOpen} onOpenChange={setManageStudentsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Students</DialogTitle>
            <DialogDescription>
              Search and select students to enroll
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or ID..."
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="max-h-[250px] overflow-y-auto border rounded-lg">
              {studentSearchQuery.length < 2 ? (
                <p className="text-sm text-muted-foreground p-4 text-center">
                  Type at least 2 characters to search
                </p>
              ) : availableStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4 text-center">
                  No students found
                </p>
              ) : (
                <div className="divide-y">
                  {availableStudents.slice(0, 10).map(holder => {
                    const account = educationAccounts.find(acc => acc.holderId === holder.id);
                    return (
                      <div key={holder.id} className="flex items-center gap-3 p-3 hover:bg-muted/50">
                        <Checkbox
                          checked={selectedStudentIds.includes(holder.id)}
                          onCheckedChange={(checked) => handleSelectStudent(holder.id, !!checked)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {holder.firstName} {holder.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {account?.id || holder.id}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            {selectedStudentIds.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedStudentIds.length} student(s) selected
              </p>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageStudentsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddSelectedStudents}
              disabled={selectedStudentIds.length === 0}
            >
              Add Selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default CourseDetailPage;
