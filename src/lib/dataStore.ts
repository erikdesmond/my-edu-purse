// Reactive data store for managing state that can be updated
import { 
  AccountHolder, 
  EducationAccount, 
  Course, 
  Enrolment, 
  Transaction,
  OutstandingCharge,
  Batch,
  AuditLog,
  AdminUser,
  accountHolders as initialAccountHolders,
  educationAccounts as initialEducationAccounts,
  courses as initialCourses,
  enrolments as initialEnrolments,
  transactions as initialTransactions,
  outstandingCharges as initialOutstandingCharges,
  batches as initialBatches,
  auditLogs as initialAuditLogs,
  adminUsers as initialAdminUsers
} from './data';

// Mutable data stores
let accountHolders: AccountHolder[] = [...initialAccountHolders];
let educationAccounts: EducationAccount[] = [...initialEducationAccounts];
let courses: Course[] = [...initialCourses];
let enrolments: Enrolment[] = [...initialEnrolments];
let transactions: Transaction[] = [...initialTransactions];
let outstandingCharges: OutstandingCharge[] = [...initialOutstandingCharges];
let batches: Batch[] = [...initialBatches];
let auditLogs: AuditLog[] = [...initialAuditLogs];
let adminUsers: AdminUser[] = [...initialAdminUsers];

// Subscribers for state changes
type Listener = () => void;
const listeners: Set<Listener> = new Set();

export const subscribe = (listener: Listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const notify = () => {
  listeners.forEach(listener => listener());
};

// Getters
export const getAccountHolders = () => accountHolders;
export const getEducationAccounts = () => educationAccounts;
export const getCourses = () => courses;
export const getEnrolments = () => enrolments;
export const getTransactions = () => transactions;
export const getOutstandingCharges = () => outstandingCharges;
export const getBatches = () => batches;
export const getAuditLogs = () => auditLogs;
export const getAdminUsers = () => adminUsers;

// Account Holder operations
export const addAccountHolder = (holder: AccountHolder) => {
  accountHolders = [...accountHolders, holder];
  notify();
};

export const updateAccountHolder = (id: string, updates: Partial<AccountHolder>) => {
  accountHolders = accountHolders.map(ah => 
    ah.id === id ? { ...ah, ...updates } : ah
  );
  notify();
};

// Education Account operations
export const addEducationAccount = (account: EducationAccount) => {
  educationAccounts = [...educationAccounts, account];
  notify();
};

export const updateEducationAccount = (id: string, updates: Partial<EducationAccount>) => {
  educationAccounts = educationAccounts.map(ea => 
    ea.id === id ? { ...ea, ...updates } : ea
  );
  notify();
};

// Course operations
export const addCourse = (course: Course) => {
  courses = [...courses, course];
  notify();
};

export const updateCourse = (id: string, updates: Partial<Course>) => {
  courses = courses.map(c => 
    c.id === id ? { ...c, ...updates } : c
  );
  notify();
};

export const deleteCourse = (id: string) => {
  courses = courses.filter(c => c.id !== id);
  notify();
};

// Enrolment operations
export const addEnrolment = (enrolment: Enrolment) => {
  enrolments = [...enrolments, enrolment];
  notify();
};

export const updateEnrolment = (id: string, updates: Partial<Enrolment>) => {
  enrolments = enrolments.map(e => 
    e.id === id ? { ...e, ...updates } : e
  );
  notify();
};

export const removeEnrolment = (id: string) => {
  enrolments = enrolments.filter(e => e.id !== id);
  notify();
};

// Transaction operations
export const addTransaction = (transaction: Transaction) => {
  transactions = [...transactions, transaction];
  notify();
};

// Batch operations
export const addBatch = (batch: Batch) => {
  batches = [...batches, batch];
  notify();
};

export const updateBatch = (id: string, updates: Partial<Batch>) => {
  batches = batches.map(b => 
    b.id === id ? { ...b, ...updates } : b
  );
  notify();
};

// Audit Log operations
export const addAuditLog = (log: AuditLog) => {
  auditLogs = [log, ...auditLogs];
  notify();
};

// Admin User operations
export const addAdminUser = (user: AdminUser) => {
  adminUsers = [...adminUsers, user];
  notify();
};

export const updateAdminUser = (id: string, updates: Partial<AdminUser>) => {
  adminUsers = adminUsers.map(u => 
    u.id === id ? { ...u, ...updates } : u
  );
  notify();
};

export const deleteAdminUser = (id: string) => {
  adminUsers = adminUsers.filter(u => u.id !== id);
  notify();
};

// Outstanding Charges operations
export const addOutstandingCharge = (charge: OutstandingCharge) => {
  outstandingCharges = [...outstandingCharges, charge];
  notify();
};

export const updateOutstandingCharge = (id: string, updates: Partial<OutstandingCharge>) => {
  outstandingCharges = outstandingCharges.map(c => 
    c.id === id ? { ...c, ...updates } : c
  );
  notify();
};

// Helper functions
export const getAccountHolder = (id: string) => accountHolders.find(ah => ah.id === id);
export const getEducationAccount = (id: string) => educationAccounts.find(ea => ea.id === id);
export const getEducationAccountByHolder = (holderId: string) => educationAccounts.find(ea => ea.holderId === holderId);
export const getCourse = (id: string) => courses.find(c => c.id === id);
export const getEnrolmentsByHolder = (holderId: string) => enrolments.filter(e => e.holderId === holderId);
export const getEnrolmentsByCourse = (courseId: string) => enrolments.filter(e => e.courseId === courseId);
export const getTransactionsByAccount = (accountId: string) => transactions.filter(t => t.accountId === accountId);
export const getOutstandingChargesByAccount = (accountId: string) => outstandingCharges.filter(c => c.accountId === accountId);

// Stats helpers
export const getActiveAccountsCount = () => educationAccounts.filter(ea => ea.status === 'active').length;
