import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserRole, accountHolders, educationAccounts, getAccountHolder, getEducationAccountByHolder } from '@/lib/data';

type PortalType = 'admin' | 'citizen';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface CitizenUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  accountId: string;
}

interface AuthContextType {
  portal: PortalType | null;
  adminUser: AdminUser | null;
  citizenUser: CitizenUser | null;
  loginAsAdmin: (email: string, password: string) => boolean;
  loginAsCitizen: (email: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [portal, setPortal] = useState<PortalType | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [citizenUser, setCitizenUser] = useState<CitizenUser | null>(null);

  const loginAsAdmin = (email: string, password: string): boolean => {
    // Demo login - accept any email ending with @moe.gov.sg
    if (email.endsWith('@moe.gov.sg') && password.length >= 1) {
      setPortal('admin');
      setAdminUser({
        id: 'USR001',
        name: 'John Tan',
        email: email,
        role: 'admin'
      });
      return true;
    }
    return false;
  };

  const loginAsCitizen = (email: string, password: string): boolean => {
    // Demo login - find account holder by email
    const holder = accountHolders.find(ah => ah.email.toLowerCase() === email.toLowerCase());
    if (holder && password.length >= 1) {
      const account = getEducationAccountByHolder(holder.id);
      if (account) {
        setPortal('citizen');
        setCitizenUser({
          id: holder.id,
          firstName: holder.firstName,
          lastName: holder.lastName,
          email: holder.email,
          accountId: account.id
        });
        return true;
      }
    }
    return false;
  };

  const logout = () => {
    setPortal(null);
    setAdminUser(null);
    setCitizenUser(null);
  };

  return (
    <AuthContext.Provider value={{
      portal,
      adminUser,
      citizenUser,
      loginAsAdmin,
      loginAsCitizen,
      logout,
      isAuthenticated: portal !== null
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
