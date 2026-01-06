import React, { useState } from 'react';
import { Plus, Edit, Trash2, Users, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
  removeEnrolment
} from '@/lib/dataStore';
import { formatCurrency } from '@/lib/data';

const CoursesPage: React.FC = () => {
  const courses = useDataStore(getCourses);
  const accountHolders = useDataStore(getAccountHolders);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [manageStudentsDialogOpen, setManageStudentsDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<typeof courses[0] | null>(null);
  
  // Form states
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formFee, setFormFee] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [selectedHolderId, setSelectedHolderId] = useState('');

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setFormCode('');
    setFormName('');
    setFormFee('');
    setFormDescription('');
    setFormActive(true);
  };

  const handleCreateCourse = () => {
    if (!formCode || !formName || !formFee) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const newCourse = {
      id: `CRS${String(Date.now()).slice(-6)}`,
      code: formCode.toUpperCase(),
      name: formName,
      monthlyFee: parseFloat(formFee),
      description: formDescription,
      isActive: formActive,
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
    setEditDialogOpen(true);
  };

  const handleUpdateCourse = () => {
    if (!selectedCourse || !formCode || !formName || !formFee) return;

    updateCourse(selectedCourse.id, {
      code: formCode.toUpperCase(),
      name: formName,
      monthlyFee: parseFloat(formFee),
      description: formDescription,
      isActive: formActive,
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
    setManageStudentsDialogOpen(true);
  };

  const handleAddStudent = () => {
    if (!selectedCourse || !selectedHolderId) return;

    const enrolments = getEnrolmentsByCourse(selectedCourse.id);
    const existing = enrolments.find(e => e.holderId === selectedHolderId && e.isActive);

    if (existing) {
      toast({
        title: "Already Enrolled",
        description: "This student is already enrolled in this course.",
        variant: "destructive",
      });
      return;
    }

    addEnrolment({
      id: `ENR${String(Date.now()).slice(-6)}`,
      holderId: selectedHolderId,
      courseId: selectedCourse.id,
      startDate: new Date().toISOString().split('T')[0],
      endDate: null,
      isActive: true,
    });

    const holder = getAccountHolder(selectedHolderId);
    toast({
      title: "Student Enrolled",
      description: `${holder?.firstName} ${holder?.lastName} enrolled in ${selectedCourse.name}.`,
    });

    setSelectedHolderId('');
  };

  const handleRemoveStudent = (enrolmentId: string) => {
    removeEnrolment(enrolmentId);
    toast({
      title: "Student Removed",
      description: "Student has been removed from the course.",
    });
  };

  return (
    <AdminLayout>
      <PageHeader 
        title="Courses" 
        description="Manage courses and their monthly fees"
      >
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
                  <Label htmlFor="fee">Monthly Fee (SGD) *</Label>
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
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Brief description of the course"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="active">Active</Label>
                <Switch 
                  id="active" 
                  checked={formActive}
                  onCheckedChange={setFormActive}
                />
              </div>
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
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{activeEnrolments.length} enrolled</span>
                  </div>
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(course.monthlyFee)}/mo
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editCode">Course Code *</Label>
                <Input 
                  id="editCode" 
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editFee">Monthly Fee (SGD) *</Label>
                <Input 
                  id="editFee" 
                  type="number" 
                  value={formFee}
                  onChange={(e) => setFormFee(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editName">Course Name *</Label>
              <Input 
                id="editName" 
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editDescription">Description</Label>
              <Textarea 
                id="editDescription" 
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="editActive">Active</Label>
              <Switch 
                id="editActive" 
                checked={formActive}
                onCheckedChange={setFormActive}
              />
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

      {/* Manage Students Dialog */}
      <Dialog open={manageStudentsDialogOpen} onOpenChange={setManageStudentsDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Students - {selectedCourse?.name}</DialogTitle>
            <DialogDescription>
              Add or remove students from this course.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Add Student */}
            <div className="flex gap-2">
              <Select value={selectedHolderId} onValueChange={setSelectedHolderId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a student to enroll" />
                </SelectTrigger>
                <SelectContent>
                  {accountHolders.map(holder => (
                    <SelectItem key={holder.id} value={holder.id}>
                      {holder.firstName} {holder.lastName} ({holder.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddStudent} disabled={!selectedHolderId}>
                <Plus className="h-4 w-4 mr-1" /> Enroll
              </Button>
            </div>

            {/* Current Students */}
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