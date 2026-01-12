import React, { useState, useMemo } from 'react';
import { Download, FileSpreadsheet, BarChart3, Users, DollarSign, BookOpen, TrendingUp } from 'lucide-react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatCard } from '@/components/shared/StatCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { toast } from '@/hooks/use-toast';
import { useDataStore } from '@/hooks/useDataStore';
import { getCourses, getEnrolments, getTransactions } from '@/lib/dataStore';
import { formatCurrency, formatDate } from '@/lib/data';

const CoursesReportPage: React.FC = () => {
  const courses = useDataStore(getCourses);
  const enrolments = useDataStore(getEnrolments);
  const transactions = useDataStore(getTransactions);
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');

  // Get unique providers
  const providers = useMemo(() => {
    const uniqueProviders = [...new Set(courses.map(c => c.provider))];
    return uniqueProviders.sort();
  }, [courses]);

  // Calculate statistics for each course
  const courseStats = useMemo(() => {
    return courses.map(course => {
      const courseEnrolments = enrolments.filter(e => e.courseId === course.id);
      const activeEnrolments = courseEnrolments.filter(e => e.isActive);
      const courseTransactions = transactions.filter(t => t.courseId === course.id);
      const totalRevenue = courseTransactions
        .filter(t => t.type === 'charge' && t.status === 'completed')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      return {
        ...course,
        totalEnrolments: courseEnrolments.length,
        activeEnrolments: activeEnrolments.length,
        totalRevenue,
      };
    });
  }, [courses, enrolments, transactions]);

  // Apply filters
  const filteredCourses = useMemo(() => {
    return courseStats.filter(course => {
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && course.isActive) ||
        (statusFilter === 'inactive' && !course.isActive);
      const matchesProvider = providerFilter === 'all' || course.provider === providerFilter;
      return matchesStatus && matchesProvider;
    });
  }, [courseStats, statusFilter, providerFilter]);

  // Overall statistics
  const overallStats = useMemo(() => {
    const activeCourses = courses.filter(c => c.isActive).length;
    const totalEnrolments = enrolments.length;
    const activeEnrolments = enrolments.filter(e => e.isActive).length;
    const totalRevenue = transactions
      .filter(t => t.type === 'charge' && t.status === 'completed' && t.courseId)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    return {
      totalCourses: courses.length,
      activeCourses,
      totalEnrolments,
      activeEnrolments,
      totalRevenue,
    };
  }, [courses, enrolments, transactions]);

  // Export to Excel/CSV
  const handleExport = (format: 'csv' | 'excel') => {
    const headers = [
      'Course Code',
      'Course Name',
      'Provider',
      'Monthly Fee',
      'Status',
      'Total Enrolments',
      'Active Enrolments',
      'Total Revenue',
      'Start Date',
      'End Date',
    ];

    const rows = filteredCourses.map(course => [
      course.code,
      course.name,
      course.provider,
      course.monthlyFee,
      course.isActive ? 'Active' : 'Inactive',
      course.totalEnrolments,
      course.activeEnrolments,
      course.totalRevenue,
      course.startDate || '',
      course.endDate || '',
    ]);

    if (format === 'csv') {
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `courses_report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: "Courses report has been exported as CSV.",
      });
    } else {
      // For Excel, we'll create a more formatted CSV that Excel can open
      const excelContent = [
        headers.join('\t'),
        ...rows.map(row => row.join('\t'))
      ].join('\n');

      const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `courses_report_${new Date().toISOString().split('T')[0]}.xls`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: "Courses report has been exported as Excel file.",
      });
    }
  };

  return (
    <AdminLayout>
      <PageHeader 
        title="Courses Report" 
        description="View course statistics and export reports"
      >
        <Button variant="outline" onClick={() => handleExport('csv')}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
        <Button onClick={() => handleExport('excel')}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export Excel
        </Button>
      </PageHeader>

      {/* Overview Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-6">
        <StatCard
          title="Total Courses"
          value={overallStats.totalCourses}
          subtitle={`${overallStats.activeCourses} active`}
          icon={<BookOpen className="h-5 w-5" />}
          variant="primary"
        />
        <StatCard
          title="Active Courses"
          value={overallStats.activeCourses}
          subtitle="Currently running"
          icon={<TrendingUp className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          title="Total Enrolments"
          value={overallStats.totalEnrolments}
          subtitle={`${overallStats.activeEnrolments} active`}
          icon={<Users className="h-5 w-5" />}
          variant="info"
        />
        <StatCard
          title="Active Enrolments"
          value={overallStats.activeEnrolments}
          subtitle="Students enrolled"
          icon={<Users className="h-5 w-5" />}
          variant="default"
        />
        <StatCard
          title="Total Revenue"
          value={formatCurrency(overallStats.totalRevenue)}
          subtitle="From course fees"
          icon={<DollarSign className="h-5 w-5" />}
          variant="warning"
        />
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="flex gap-3 flex-1">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={providerFilter} onValueChange={setProviderFilter}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  {providers.map(provider => (
                    <SelectItem key={provider} value={provider}>{provider}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              Showing {filteredCourses.length} of {courses.length} courses
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Courses Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Course Statistics
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course Code</TableHead>
                <TableHead>Course Name</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead className="text-right">Monthly Fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Total Enrolments</TableHead>
                <TableHead className="text-center">Active Enrolments</TableHead>
                <TableHead className="text-right">Total Revenue</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-mono text-sm">{course.code}</TableCell>
                  <TableCell className="font-medium">{course.name}</TableCell>
                  <TableCell className="text-sm">{course.provider}</TableCell>
                  <TableCell className="text-right">{formatCurrency(course.monthlyFee)}</TableCell>
                  <TableCell>
                    <Badge variant={course.isActive ? 'success' : 'secondary'}>
                      {course.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{course.totalEnrolments}</TableCell>
                  <TableCell className="text-center">{course.activeEnrolments}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(course.totalRevenue)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {course.startDate ? formatDate(course.startDate) : '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {course.endDate ? formatDate(course.endDate) : '-'}
                  </TableCell>
                </TableRow>
              ))}
              {filteredCourses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                    No courses found matching the filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary Footer */}
      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Report Summary</p>
              <p className="text-lg font-semibold">
                {filteredCourses.length} courses • {filteredCourses.reduce((sum, c) => sum + c.activeEnrolments, 0)} active enrolments • {formatCurrency(filteredCourses.reduce((sum, c) => sum + c.totalRevenue, 0))} total revenue
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button size="sm" onClick={() => handleExport('excel')}>
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default CoursesReportPage;
