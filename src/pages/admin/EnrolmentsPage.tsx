import React, { useState } from 'react';
import { Search, UserPlus, X } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useDataStore } from '@/hooks/useDataStore';
import { 
  getEnrolments, 
  getCourses, 
  getAccountHolders,
  getAccountHolder,
  getCourse,
  addEnrolment,
  updateEnrolment
} from '@/lib/dataStore';
import { formatDate, formatCurrency } from '@/lib/data';

const EnrolmentsPage: React.FC = () => {
  const enrolments = useDataStore(getEnrolments);
  const courses = useDataStore(getCourses);
  const accountHolders = useDataStore(getAccountHolders);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  // Form state
  const [selectedHolderId, setSelectedHolderId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');

  const filteredEnrolments = enrolments.filter(enrolment => {
    const holder = getAccountHolder(enrolment.holderId);
    const course = getCourse(enrolment.courseId);
    if (!holder || !course) return false;

    const matchesSearch = 
      holder.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      holder.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCourse = courseFilter === 'all' || enrolment.courseId === courseFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && enrolment.isActive) ||
      (statusFilter === 'inactive' && !enrolment.isActive);

    return matchesSearch && matchesCourse && matchesStatus;
  });

  const handleCreateEnrolment = () => {
    if (!selectedHolderId || !selectedCourseId) {
      toast({
        title: "Validation Error",
        description: "Please select both an account holder and a course.",
        variant: "destructive",
      });
      return;
    }

    // Check if already enrolled
    const existing = enrolments.find(e => 
      e.holderId === selectedHolderId && 
      e.courseId === selectedCourseId && 
      e.isActive
    );

    if (existing) {
      toast({
        title: "Already Enrolled",
        description: "This account holder is already enrolled in this course.",
        variant: "destructive",
      });
      return;
    }

    const newEnrolment = {
      id: `ENR${String(Date.now()).slice(-6)}`,
      holderId: selectedHolderId,
      courseId: selectedCourseId,
      startDate: new Date().toISOString().split('T')[0],
      endDate: null,
      isActive: true,
    };

    addEnrolment(newEnrolment);

    const holder = getAccountHolder(selectedHolderId);
    const course = getCourse(selectedCourseId);

    toast({
      title: "Enrolment Created",
      description: `${holder?.firstName} ${holder?.lastName} enrolled in ${course?.name}.`,
    });

    setCreateDialogOpen(false);
    setSelectedHolderId('');
    setSelectedCourseId('');
  };

  const handleEndEnrolment = (enrolmentId: string) => {
    updateEnrolment(enrolmentId, {
      isActive: false,
      endDate: new Date().toISOString().split('T')[0],
    });

    toast({
      title: "Enrolment Ended",
      description: "The enrolment has been marked as inactive.",
    });
  };

  return (
    <AdminLayout>
      <PageHeader 
        title="Enrolments" 
        description="Manage student course enrolments"
      >
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              New Enrolment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Enrolment</DialogTitle>
              <DialogDescription>Enrol an account holder in a course.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Account Holder</Label>
                <Select value={selectedHolderId} onValueChange={setSelectedHolderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account holder" />
                  </SelectTrigger>
                  <SelectContent>
                    {accountHolders.map(holder => (
                      <SelectItem key={holder.id} value={holder.id}>
                        {holder.firstName} {holder.lastName} ({holder.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Course</Label>
                <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.filter(c => c.isActive).map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.code} - {course.name} ({formatCurrency(course.monthlyFee)}/mo)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateEnrolment}>Create Enrolment</Button>
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
                placeholder="Search by student or course name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={courseFilter} onValueChange={setCourseFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Enrolments Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Monthly Fee</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEnrolments.map(enrolment => {
                const holder = getAccountHolder(enrolment.holderId);
                const course = getCourse(enrolment.courseId);
                if (!holder || !course) return null;

                return (
                  <TableRow key={enrolment.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{holder.firstName} {holder.lastName}</p>
                        <p className="text-sm text-muted-foreground">{holder.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{course.name}</p>
                        <p className="text-sm text-muted-foreground">{course.code}</p>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(course.monthlyFee)}</TableCell>
                    <TableCell>{formatDate(enrolment.startDate)}</TableCell>
                    <TableCell>
                      {enrolment.endDate ? formatDate(enrolment.endDate) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={enrolment.isActive ? 'success' : 'secondary'}>
                        {enrolment.isActive ? 'Active' : 'Ended'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {enrolment.isActive && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleEndEnrolment(enrolment.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="mt-4 text-sm text-muted-foreground text-center">
        Showing {filteredEnrolments.length} of {enrolments.length} enrolments
      </p>
    </AdminLayout>
  );
};

export default EnrolmentsPage;
