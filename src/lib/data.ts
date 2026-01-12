// Data types and mock data for the MoE Education Account System
// NOTE: Full NRICs are NOT stored client-side - only masked versions

export type UserRole = 'admin' | 'finance' | 'school_ops' | 'customer_service' | 'it_support';
export type AccountStatus = 'active' | 'suspended' | 'closed' | 'pending';
export type TransactionType = 'top_up' | 'charge' | 'payment';
export type TransactionStatus = 'completed' | 'pending' | 'failed';
export type PaymentStatus = 'paid' | 'unpaid' | 'overdue' | 'partial';
export type SchoolingStatus = 'in_school' | 'graduated' | 'dropped_out' | 'deferred';

export interface AccountHolder {
  id: string;
  firstName: string;
  lastName: string;
  nricMasked: string; // Only masked NRIC (e.g., "****345A") - never full NRIC client-side
  email: string;
  phone: string;
  dateOfBirth: string;
  age: number;
  address: string;
  schoolingStatus: SchoolingStatus;
  createdAt: string;
}

export interface EducationAccount {
  id: string;
  holderId: string;
  balance: number;
  status: AccountStatus;
  openedAt: string;
  suspendedAt: string | null;
  closedAt: string | null;
  lastTopUpDate: string | null;
}

export type PaymentType = 'one_time' | 'recurring';
export type BillingCycle = 'monthly' | 'quarterly' | 'bi_annually' | 'annually';

export interface Course {
  id: string;
  code: string;
  name: string;
  monthlyFee: number;
  description: string;
  isActive: boolean;
  paymentType?: PaymentType;
  billingCycle?: BillingCycle;
  durationMonths?: number;
  startDate?: string;
  endDate?: string;
}

export interface Enrolment {
  id: string;
  holderId: string;
  courseId: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
}

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  description: string; // Internal description (admin only)
  externalDescription?: string; // External description (visible to students)
  reference: string;
  status: TransactionStatus;
  createdAt: string;
  courseId?: string;
  period?: string;
}

export interface OutstandingCharge {
  id: string;
  accountId: string;
  courseId: string;
  courseName: string;
  period: string;
  amount: number;
  dueDate: string;
  status: PaymentStatus;
}

export interface Batch {
  id: string;
  type: 'top_up' | 'fee_run';
  description: string; // Internal description (admin only)
  externalDescription?: string; // External description (visible to students)
  totalAmount: number;
  accountCount: number;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
  createdBy: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userName: string;
  details: string;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
}

// Demo Account Holders - NRICs are MASKED (never full NRIC client-side)
export const accountHolders: AccountHolder[] = [
  { id: 'AH001', firstName: 'Wei Ming', lastName: 'Tan', nricMasked: '****345A', email: 'weiming.tan@email.com', phone: '+65 9123 4567', dateOfBirth: '2000-03-15', age: 24, address: '123 Orchard Road, Singapore 238888', schoolingStatus: 'in_school', createdAt: '2023-01-15' },
  { id: 'AH002', firstName: 'Priya', lastName: 'Kumar', nricMasked: '****456B', email: 'priya.kumar@email.com', phone: '+65 9234 5678', dateOfBirth: '1998-07-22', age: 26, address: '45 Tampines Ave 3, Singapore 529001', schoolingStatus: 'graduated', createdAt: '2022-08-20' },
  { id: 'AH003', firstName: 'Muhammad', lastName: 'Ali', nricMasked: '****567C', email: 'muhammad.ali@email.com', phone: '+65 9345 6789', dateOfBirth: '2005-11-08', age: 19, address: '78 Jurong West St 41, Singapore 649410', schoolingStatus: 'in_school', createdAt: '2024-01-10' },
  { id: 'AH004', firstName: 'Mei Ling', lastName: 'Lim', nricMasked: '****678D', email: 'meiling.lim@email.com', phone: '+65 9456 7890', dateOfBirth: '2002-05-30', age: 22, address: '12 Marine Parade, Singapore 449269', schoolingStatus: 'in_school', createdAt: '2023-06-05' },
  { id: 'AH005', firstName: 'Raj', lastName: 'Sharma', nricMasked: '****789E', email: 'raj.sharma@email.com', phone: '+65 9567 8901', dateOfBirth: '1996-09-12', age: 28, address: '56 Bukit Timah Rd, Singapore 229839', schoolingStatus: 'graduated', createdAt: '2021-03-25' },
  { id: 'AH006', firstName: 'Sarah', lastName: 'Chen', nricMasked: '****890F', email: 'sarah.chen@email.com', phone: '+65 9678 9012', dateOfBirth: '2007-02-18', age: 17, address: '34 Bedok North Ave 1, Singapore 469646', schoolingStatus: 'in_school', createdAt: '2024-06-01' },
  { id: 'AH007', firstName: 'Ahmad', lastName: 'Ibrahim', nricMasked: '****901G', email: 'ahmad.ibrahim@email.com', phone: '+65 9789 0123', dateOfBirth: '2001-12-25', age: 23, address: '89 Woodlands Ave 5, Singapore 738985', schoolingStatus: 'deferred', createdAt: '2023-09-15' },
  { id: 'AH008', firstName: 'Yan Ting', lastName: 'Wong', nricMasked: '****012H', email: 'yanting.wong@email.com', phone: '+65 9890 1234', dateOfBirth: '2004-08-10', age: 20, address: '23 Serangoon Garden Way, Singapore 555948', schoolingStatus: 'in_school', createdAt: '2024-02-20' },
  { id: 'AH009', firstName: 'Kavitha', lastName: 'Nair', nricMasked: '****123J', email: 'kavitha.nair@email.com', phone: '+65 9901 2345', dateOfBirth: '1999-04-05', age: 25, address: '67 Clementi Ave 2, Singapore 129803', schoolingStatus: 'graduated', createdAt: '2022-11-10' },
  { id: 'AH010', firstName: 'Jun Wei', lastName: 'Ong', nricMasked: '****234K', email: 'junwei.ong@email.com', phone: '+65 9012 3456', dateOfBirth: '2006-01-20', age: 18, address: '41 Pasir Ris Dr 6, Singapore 519422', schoolingStatus: 'in_school', createdAt: '2024-08-15' },
  { id: 'AH011', firstName: 'Aisha', lastName: 'Hassan', nricMasked: '****345L', email: 'aisha.hassan@email.com', phone: '+65 9111 2222', dateOfBirth: '2003-06-14', age: 21, address: '15 Yishun Ave 11, Singapore 768853', schoolingStatus: 'in_school', createdAt: '2023-04-22' },
  { id: 'AH012', firstName: 'Kevin', lastName: 'Lee', nricMasked: '****456M', email: 'kevin.lee@email.com', phone: '+65 9222 3333', dateOfBirth: '1997-10-30', age: 27, address: '88 Toa Payoh Lorong 4, Singapore 310088', schoolingStatus: 'dropped_out', createdAt: '2021-07-18' },
];

// Demo Education Accounts - AH001 (Wei Ming) has $100 balance to demonstrate combined payment
export const educationAccounts: EducationAccount[] = [
  { id: 'EA001', holderId: 'AH001', balance: 100.00, status: 'active', openedAt: '2023-01-15', suspendedAt: null, closedAt: null, lastTopUpDate: '2024-12-01' },
  { id: 'EA002', holderId: 'AH002', balance: 450.50, status: 'active', openedAt: '2022-08-20', suspendedAt: null, closedAt: null, lastTopUpDate: '2024-11-15' },
  { id: 'EA003', holderId: 'AH003', balance: 2000.00, status: 'active', openedAt: '2024-01-10', suspendedAt: null, closedAt: null, lastTopUpDate: '2024-12-20' },
  { id: 'EA004', holderId: 'AH004', balance: 875.25, status: 'active', openedAt: '2023-06-05', suspendedAt: null, closedAt: null, lastTopUpDate: '2024-10-01' },
  { id: 'EA005', holderId: 'AH005', balance: 0.00, status: 'closed', openedAt: '2021-03-25', suspendedAt: null, closedAt: '2024-03-25', lastTopUpDate: '2023-12-01' },
  { id: 'EA006', holderId: 'AH006', balance: 1500.00, status: 'active', openedAt: '2024-06-01', suspendedAt: null, closedAt: null, lastTopUpDate: '2024-12-15' },
  { id: 'EA007', holderId: 'AH007', balance: 320.00, status: 'suspended', openedAt: '2023-09-15', suspendedAt: '2024-09-20', closedAt: null, lastTopUpDate: '2024-08-01' },
  { id: 'EA008', holderId: 'AH008', balance: 1100.00, status: 'active', openedAt: '2024-02-20', suspendedAt: null, closedAt: null, lastTopUpDate: '2024-11-30' },
  { id: 'EA009', holderId: 'AH009', balance: 200.00, status: 'active', openedAt: '2022-11-10', suspendedAt: null, closedAt: null, lastTopUpDate: '2024-09-15' },
  { id: 'EA010', holderId: 'AH010', balance: 1800.00, status: 'pending', openedAt: '2024-08-15', suspendedAt: null, closedAt: null, lastTopUpDate: '2024-12-01' },
  { id: 'EA011', holderId: 'AH011', balance: 650.00, status: 'active', openedAt: '2023-04-22', suspendedAt: null, closedAt: null, lastTopUpDate: '2024-11-01' },
  { id: 'EA012', holderId: 'AH012', balance: 50.00, status: 'suspended', openedAt: '2021-07-18', suspendedAt: '2023-08-15', closedAt: null, lastTopUpDate: '2023-06-01' },
];

// Demo Courses with payment types
export const courses: Course[] = [
  { id: 'CRS001', code: 'IT101', name: 'Introduction to Programming', monthlyFee: 150.00, description: 'Basic programming concepts and Python', isActive: true, paymentType: 'recurring', billingCycle: 'monthly', durationMonths: 6, startDate: '2024-01-01', endDate: '2024-06-30' },
  { id: 'CRS002', code: 'BUS201', name: 'Business Management', monthlyFee: 200.00, description: 'Fundamentals of business operations', isActive: true, paymentType: 'recurring', billingCycle: 'quarterly', durationMonths: 12, startDate: '2024-01-01', endDate: '2024-12-31' },
  { id: 'CRS003', code: 'ENG102', name: 'English Communication', monthlyFee: 50.00, description: 'Professional English writing and speaking', isActive: true, paymentType: 'recurring', billingCycle: 'monthly', durationMonths: 3, startDate: '2024-01-01', endDate: '2024-03-31' },
  { id: 'CRS004', code: 'ACC301', name: 'Financial Accounting', monthlyFee: 180.00, description: 'Accounting principles and practices', isActive: true, paymentType: 'recurring', billingCycle: 'bi_annually', durationMonths: 12, startDate: '2024-01-01', endDate: '2024-12-31' },
  { id: 'CRS005', code: 'DES101', name: 'Graphic Design Basics', monthlyFee: 175.00, description: 'Introduction to visual design', isActive: true, paymentType: 'one_time', durationMonths: 3, startDate: '2024-07-01', endDate: '2024-09-30' },
  { id: 'CRS006', code: 'MKT201', name: 'Digital Marketing', monthlyFee: 160.00, description: 'Online marketing strategies', isActive: true, paymentType: 'recurring', billingCycle: 'monthly', durationMonths: 4, startDate: '2024-05-01', endDate: '2024-08-31' },
  { id: 'CRS007', code: 'DATA101', name: 'Data Analytics', monthlyFee: 220.00, description: 'Data analysis and visualization', isActive: true, paymentType: 'recurring', billingCycle: 'monthly', durationMonths: 6, startDate: '2024-10-01', endDate: '2025-03-31' },
  { id: 'CRS008', code: 'WEB201', name: 'Web Development', monthlyFee: 190.00, description: 'Modern web technologies', isActive: false, paymentType: 'recurring', billingCycle: 'annually', durationMonths: 12, startDate: '2024-01-01', endDate: '2024-12-31' },
];

// Demo Enrolments - AH001 has more courses to demonstrate payment scenarios
export const enrolments: Enrolment[] = [
  { id: 'ENR001', holderId: 'AH001', courseId: 'CRS001', startDate: '2024-01-01', endDate: null, isActive: true },
  { id: 'ENR002', holderId: 'AH001', courseId: 'CRS003', startDate: '2024-01-01', endDate: null, isActive: true },
  { id: 'ENR009', holderId: 'AH001', courseId: 'CRS007', startDate: '2024-10-01', endDate: null, isActive: true },
  { id: 'ENR010', holderId: 'AH001', courseId: 'CRS002', startDate: '2024-06-01', endDate: null, isActive: true },
  { id: 'ENR003', holderId: 'AH003', courseId: 'CRS001', startDate: '2024-02-01', endDate: null, isActive: true },
  { id: 'ENR004', holderId: 'AH004', courseId: 'CRS002', startDate: '2023-09-01', endDate: null, isActive: true },
  { id: 'ENR005', holderId: 'AH006', courseId: 'CRS005', startDate: '2024-07-01', endDate: null, isActive: true },
  { id: 'ENR006', holderId: 'AH008', courseId: 'CRS007', startDate: '2024-03-01', endDate: null, isActive: true },
  { id: 'ENR007', holderId: 'AH011', courseId: 'CRS006', startDate: '2024-05-01', endDate: null, isActive: true },
  { id: 'ENR008', holderId: 'AH002', courseId: 'CRS004', startDate: '2023-01-01', endDate: '2024-06-30', isActive: false },
];

// Demo Transactions
export const transactions: Transaction[] = [
  { id: 'TXN001', accountId: 'EA001', type: 'top_up', amount: 500.00, balanceAfter: 1500.00, description: 'Annual Education Subsidy', reference: 'AES-2024-001', status: 'completed', createdAt: '2024-12-01T09:30:00' },
  { id: 'TXN002', accountId: 'EA001', type: 'charge', amount: -150.00, balanceAfter: 1350.00, description: 'Course Fee - IT101', reference: 'FEE-2024-DEC-001', status: 'completed', createdAt: '2024-12-05T14:00:00', courseId: 'CRS001', period: 'Dec 2024' },
  { id: 'TXN003', accountId: 'EA001', type: 'charge', amount: -100.00, balanceAfter: 1250.00, description: 'Course Fee - ENG102', reference: 'FEE-2024-DEC-002', status: 'completed', createdAt: '2024-12-05T14:01:00', courseId: 'CRS003', period: 'Dec 2024' },
  { id: 'TXN004', accountId: 'EA003', type: 'top_up', amount: 2000.00, balanceAfter: 2000.00, description: 'Initial Account Funding', reference: 'INIT-2024-003', status: 'completed', createdAt: '2024-12-20T10:00:00' },
  { id: 'TXN005', accountId: 'EA006', type: 'top_up', amount: 1000.00, balanceAfter: 1500.00, description: 'Youth Education Grant', reference: 'YEG-2024-006', status: 'completed', createdAt: '2024-12-15T11:30:00' },
  { id: 'TXN006', accountId: 'EA002', type: 'charge', amount: -180.00, balanceAfter: 450.50, description: 'Course Fee - ACC301', reference: 'FEE-2024-NOV-004', status: 'completed', createdAt: '2024-11-05T14:00:00', courseId: 'CRS004', period: 'Nov 2024' },
  { id: 'TXN007', accountId: 'EA008', type: 'top_up', amount: 500.00, balanceAfter: 1100.00, description: 'Quarterly Top-up', reference: 'QTR-2024-Q4-008', status: 'completed', createdAt: '2024-11-30T16:00:00' },
  { id: 'TXN008', accountId: 'EA004', type: 'payment', amount: 200.00, balanceAfter: 875.25, description: 'Online Payment', reference: 'PAY-2024-004', status: 'completed', createdAt: '2024-10-15T12:00:00' },
  { id: 'TXN009', accountId: 'EA011', type: 'charge', amount: -160.00, balanceAfter: 650.00, description: 'Course Fee - MKT201', reference: 'FEE-2024-NOV-011', status: 'completed', createdAt: '2024-11-05T14:00:00', courseId: 'CRS006', period: 'Nov 2024' },
  { id: 'TXN010', accountId: 'EA007', type: 'top_up', amount: 200.00, balanceAfter: 520.00, description: 'Manual Top-up', reference: 'MAN-2024-007', status: 'failed', createdAt: '2024-08-01T09:00:00' },
];

// Demo Outstanding Charges - Multiple charges for AH001 to demonstrate payment scenarios
// Scenario 1: $50 charge - balance sufficient ($100)
// Scenario 2: $150 charge - balance insufficient, need combined payment
export const outstandingCharges: OutstandingCharge[] = [
  { id: 'CHG001', accountId: 'EA001', courseId: 'CRS001', courseName: 'Introduction to Programming', period: 'Jan 2025', amount: 150.00, dueDate: '2025-01-15', status: 'unpaid' },
  { id: 'CHG002', accountId: 'EA001', courseId: 'CRS003', courseName: 'English Communication', period: 'Jan 2025', amount: 50.00, dueDate: '2025-01-15', status: 'unpaid' },
  { id: 'CHG006', accountId: 'EA001', courseId: 'CRS007', courseName: 'Data Analytics', period: 'Jan 2025', amount: 220.00, dueDate: '2025-01-20', status: 'unpaid' },
  { id: 'CHG007', accountId: 'EA001', courseId: 'CRS002', courseName: 'Business Management', period: 'Dec 2024', amount: 200.00, dueDate: '2024-12-20', status: 'overdue' },
  { id: 'CHG003', accountId: 'EA003', courseId: 'CRS001', courseName: 'Introduction to Programming', period: 'Jan 2025', amount: 150.00, dueDate: '2025-01-15', status: 'unpaid' },
  { id: 'CHG004', accountId: 'EA004', courseId: 'CRS002', courseName: 'Business Management', period: 'Dec 2024', amount: 200.00, dueDate: '2024-12-15', status: 'overdue' },
  { id: 'CHG005', accountId: 'EA011', courseId: 'CRS006', courseName: 'Digital Marketing', period: 'Dec 2024', amount: 160.00, dueDate: '2024-12-20', status: 'unpaid' },
];

// Demo Batches
export const batches: Batch[] = [
  { id: 'BAT001', type: 'top_up', description: 'Annual Education Subsidy - Dec 2024', totalAmount: 15000.00, accountCount: 30, status: 'completed', createdAt: '2024-12-01T08:00:00', createdBy: 'Admin User' },
  { id: 'BAT002', type: 'fee_run', description: 'Monthly Fee Run - Dec 2024', totalAmount: 8500.00, accountCount: 45, status: 'completed', createdAt: '2024-12-05T14:00:00', createdBy: 'Finance User' },
  { id: 'BAT003', type: 'top_up', description: 'Youth Education Grant - Q4', totalAmount: 5000.00, accountCount: 10, status: 'pending', createdAt: '2024-12-20T10:00:00', createdBy: 'Admin User' },
];

// Demo Audit Logs
export const auditLogs: AuditLog[] = [
  { id: 'AUD001', action: 'Account Created', entityType: 'EducationAccount', entityId: 'EA010', userId: 'USR001', userName: 'Admin User', details: 'New education account created for Jun Wei Ong', createdAt: '2024-12-01T10:30:00' },
  { id: 'AUD002', action: 'Batch Top-up', entityType: 'Batch', entityId: 'BAT001', userId: 'USR002', userName: 'Finance User', details: 'Annual Education Subsidy batch executed - 30 accounts, $15,000', createdAt: '2024-12-01T08:15:00' },
  { id: 'AUD003', action: 'Fee Run', entityType: 'Batch', entityId: 'BAT002', userId: 'USR002', userName: 'Finance User', details: 'Monthly fee run completed - 45 enrolments charged', createdAt: '2024-12-05T14:30:00' },
  { id: 'AUD004', action: 'Account Suspended', entityType: 'EducationAccount', entityId: 'EA007', userId: 'USR003', userName: 'School Ops', details: 'Account suspended due to deferment', createdAt: '2024-09-20T11:00:00' },
  { id: 'AUD005', action: 'Manual Top-up', entityType: 'Transaction', entityId: 'TXN007', userId: 'USR002', userName: 'Finance User', details: 'Manual top-up of $500 for account EA008', createdAt: '2024-11-30T16:05:00' },
];

// Demo Admin Users
export const adminUsers: AdminUser[] = [
  { id: 'USR001', name: 'John Tan', email: 'john.tan@moe.gov.sg', role: 'admin', isActive: true },
  { id: 'USR002', name: 'Mary Lim', email: 'mary.lim@moe.gov.sg', role: 'finance', isActive: true },
  { id: 'USR003', name: 'Ahmad Hassan', email: 'ahmad.hassan@moe.gov.sg', role: 'school_ops', isActive: true },
  { id: 'USR004', name: 'Priya Menon', email: 'priya.menon@moe.gov.sg', role: 'customer_service', isActive: true },
  { id: 'USR005', name: 'Kevin Wong', email: 'kevin.wong@moe.gov.sg', role: 'it_support', isActive: true },
];

// Helper functions
export const getAccountHolder = (id: string) => accountHolders.find(ah => ah.id === id);
export const getEducationAccount = (id: string) => educationAccounts.find(ea => ea.id === id);
export const getEducationAccountByHolder = (holderId: string) => educationAccounts.find(ea => ea.holderId === holderId);
export const getCourse = (id: string) => courses.find(c => c.id === id);
export const getEnrolmentsByHolder = (holderId: string) => enrolments.filter(e => e.holderId === holderId);
export const getEnrolmentsByCourse = (courseId: string) => enrolments.filter(e => e.courseId === courseId);
export const getTransactionsByAccount = (accountId: string) => transactions.filter(t => t.accountId === accountId);
export const getOutstandingChargesByAccount = (accountId: string) => outstandingCharges.filter(c => c.accountId === accountId);

// Format helpers
export const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('en-SG', { style: 'currency', currency: 'SGD' }).format(amount);

export const formatDate = (date: string) => 
  new Date(date).toLocaleDateString('en-SG', { year: 'numeric', month: 'short', day: 'numeric' });

export const formatDateTime = (date: string) =>
  new Date(date).toLocaleString('en-SG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

// Label helpers
export const getStatusLabel = (status: AccountStatus): string => {
  const labels: Record<AccountStatus, string> = {
    active: 'Active',
    suspended: 'Suspended',
    closed: 'Closed',
    pending: 'Pending'
  };
  return labels[status] || status;
};

export const getSchoolingLabel = (status: SchoolingStatus): string => {
  const labels: Record<SchoolingStatus, string> = {
    in_school: 'In School',
    graduated: 'Graduated',
    dropped_out: 'Dropped Out',
    deferred: 'Deferred'
  };
  return labels[status] || status;
};

export const getRoleLabel = (role: UserRole): string => {
  const labels: Record<UserRole, string> = {
    admin: 'Administrator',
    finance: 'Finance',
    school_ops: 'School Operations',
    customer_service: 'Customer Service',
    it_support: 'IT Support'
  };
  return labels[role] || role;
};
