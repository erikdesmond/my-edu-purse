import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Pages
import LandingPage from "./pages/LandingPage";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AccountsPage from "./pages/admin/AccountsPage";
import AccountDetailPage from "./pages/admin/AccountDetailPage";
import CoursesPage from "./pages/admin/CoursesPage";

// Citizen Pages
import CitizenDashboard from "./pages/citizen/CitizenDashboard";
import TransactionsPage from "./pages/citizen/TransactionsPage";
import PaymentsPage from "./pages/citizen/PaymentsPage";
import ProfilePage from "./pages/citizen/ProfilePage";

const queryClient = new QueryClient();

// Protected Route wrapper
const ProtectedRoute: React.FC<{ 
  children: React.ReactNode; 
  portal: 'admin' | 'citizen' 
}> = ({ children, portal }) => {
  const { isAuthenticated, portal: currentPortal } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  if (currentPortal !== portal) {
    return <Navigate to={currentPortal === 'admin' ? '/admin' : '/portal'} replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { isAuthenticated, portal } = useAuth();
  
  return (
    <Routes>
      {/* Public Route */}
      <Route 
        path="/" 
        element={
          isAuthenticated 
            ? <Navigate to={portal === 'admin' ? '/admin' : '/portal'} replace />
            : <LandingPage />
        } 
      />
      
      {/* Admin Portal Routes */}
      <Route path="/admin" element={<ProtectedRoute portal="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/accounts" element={<ProtectedRoute portal="admin"><AccountsPage /></ProtectedRoute>} />
      <Route path="/admin/accounts/:accountId" element={<ProtectedRoute portal="admin"><AccountDetailPage /></ProtectedRoute>} />
      <Route path="/admin/courses" element={<ProtectedRoute portal="admin"><CoursesPage /></ProtectedRoute>} />
      
      {/* Citizen Portal Routes */}
      <Route path="/portal" element={<ProtectedRoute portal="citizen"><CitizenDashboard /></ProtectedRoute>} />
      <Route path="/portal/transactions" element={<ProtectedRoute portal="citizen"><TransactionsPage /></ProtectedRoute>} />
      <Route path="/portal/payments" element={<ProtectedRoute portal="citizen"><PaymentsPage /></ProtectedRoute>} />
      <Route path="/portal/profile" element={<ProtectedRoute portal="citizen"><ProfilePage /></ProtectedRoute>} />
      
      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
