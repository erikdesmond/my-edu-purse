import React, { useState, useRef } from 'react';
import { Plus, Edit, Users, Search, X, Upload, Download, DollarSign, Calendar as CalendarIcon } from 'lucide-react';
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
  getEducationAccount
} from '@/lib/dataStore';
import { formatCurrency, formatDateTime, PaymentType, BillingCycle } from '@/lib/data';

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

const CoursesPage: React.FC = () => {
  const courses = useDataStore(getCourses);
  const accountHolders = useDataStore(getAccountHolders);
  const transactions = useDataStore(getTransactions);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [manageStudentsDialogOpen, setManageStudentsDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<typeof courses[0] | null>(null);
  
  // Form states
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
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
    setFormFee('');
    setFormDescription('');
    setFormActive(true);
    setFormPaymentType('recurring');
    setFormBillingCycle('monthly');
    setFormStartDate(undefined);
    setFormEndDate(undefined);
  };

  const handleCreateCourse = () => {
    if (!formCode || !formName || !formFee || !formDescription) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Code, Name, Fee, Description).",
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
      monthlyFee: parseFloat(formFee),
      description: formDescription,
      startDate: formStartDate ? formStartDate.toISOString().split('T')[0] : undefined,
      endDate: formEndDate ? formEndDate.toISOString().split('T')[0] : undefined,
      isActive: formActive,
      paymentType: formPaymentType,
      billingCycle: formPaymentType === 'recurring' ? formBillingCycle : undefined,
      durationMonths,
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
    if (!selectedCourse || !formCode || !formName || !formFee || !formDescription) return;

    let durationMonths = selectedCourse.durationMonths || 12;
    if (formStartDate && formEndDate) {
      const monthsDiff = (formEndDate.getFullYear() - formStartDate.getFullYear()) * 12 + (formEndDate.getMonth() - formStartDate.getMonth());
      durationMonths = Math.max(1, monthsDiff);
    }

    updateCourse(selectedCourse.id, {
      code: formCode.toUpperCase(),
      name: formName,
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

      {/* Billing Cycle - Only show for recurring */}
      {formPaymentType === 'recurring' && (
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
        title="Courses" 
        description="Manage courses and their fees"
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

      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList>
          <TabsTrigger value="courses">Course Management</TabsTrigger>
          <TabsTrigger value="fees">Fee Charges Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
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

                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleEditCourse(course)}
                  >
                    <Edit className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleManageStudents(course)}
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

          <p className="mt-6 text-sm text-muted-foreground text-center">
            Showing {filteredCourses.length} of {courses.length} courses
          </p>
        </TabsContent>

        <TabsContent value="fees">
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

      {/* Manage Students Dialog */}
      <Dialog open={manageStudentsDialogOpen} onOpenChange={setManageStudentsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Students - {selectedCourse?.name}</DialogTitle>
            <DialogDescription>
              Search and add students to this course.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Student Search */}
            <div className="space-y-2">
              <Label>Search Students</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or ID..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Selected Students */}
            {selectedStudentIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedStudentIds.map(id => {
                  const holder = getAccountHolder(id);
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
                <Button size="sm" onClick={handleAddSelectedStudents}>
                  <Plus className="h-4 w-4 mr-1" /> Enroll Selected
                </Button>
              </div>
            )}

            {/* Search Results */}
            {studentSearchQuery && (
              <div className="border rounded-lg max-h-40 overflow-y-auto">
                {filteredStudents.slice(0, 10).map(holder => {
                  const isSelected = selectedStudentIds.includes(holder.id);
                  const enrolments = selectedCourse ? getEnrolmentsByCourse(selectedCourse.id) : [];
                  const isEnrolled = enrolments.some(e => e.holderId === holder.id && e.isActive);
                  
                  return (
                    <div
                      key={holder.id}
                      className={`flex items-center justify-between p-3 cursor-pointer hover:bg-secondary/50 ${
                        isSelected ? 'bg-primary/10' : ''
                      } ${isEnrolled ? 'opacity-50' : ''}`}
                      onClick={() => !isEnrolled && handleSelectStudent(holder.id, !isSelected)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox checked={isSelected} disabled={isEnrolled} />
                        <div>
                          <p className="font-medium">{holder.firstName} {holder.lastName}</p>
                        </div>
                      </div>
                      {isEnrolled && (
                        <Badge variant="success">Already Enrolled</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Current Students */}
            <div className="space-y-2">
              <Label>Currently Enrolled Students</Label>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCourse && getEnrolmentsByCourse(selectedCourse.id)
                      .filter(e => e.isActive)
                      .map(enrolment => {
                        const holder = getAccountHolder(enrolment.holderId);
                        if (!holder) return null;

                        return (
                          <TableRow key={enrolment.id}>
                            <TableCell className="font-medium">
                              {holder.firstName} {holder.lastName}
                            </TableCell>
                            <TableCell>{enrolment.startDate}</TableCell>
                            <TableCell>
                              <Badge variant="success">Active</Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => handleRemoveStudent(enrolment.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageStudentsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default CoursesPage;