import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Shield, ArrowRight, User, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginAsAdmin, loginAsCitizen } = useAuth();
  
  const [adminEmail, setAdminEmail] = useState('admin@moe.gov.sg');
  const [adminPassword, setAdminPassword] = useState('demo123');
  const [adminError, setAdminError] = useState('');
  
  const [citizenEmail, setCitizenEmail] = useState('weiming.tan@email.com');
  const [citizenPassword, setCitizenPassword] = useState('demo123');
  const [citizenError, setCitizenError] = useState('');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    
    if (loginAsAdmin(adminEmail, adminPassword)) {
      navigate('/admin');
    } else {
      setAdminError('Invalid credentials. Use any email ending with @moe.gov.sg');
    }
  };

  const handleCitizenLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setCitizenError('');
    
    if (loginAsCitizen(citizenEmail, citizenPassword)) {
      navigate('/portal');
    } else {
      setCitizenError('Account not found. Try: weiming.tan@email.com');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <p className="text-lg font-semibold text-foreground">Education Account</p>
              <p className="text-xs text-muted-foreground">Ministry of Education</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Left: Info */}
          <div className="flex flex-col justify-center animate-fade-in">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Education Account
              <span className="block text-primary">for every learner</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-xl">
              The Education Account is a government initiative to support lifelong learning. 
              Eligible citizens receive credits to pay for approved courses and programs.
            </p>
            
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-success/10">
                  <GraduationCap className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Pay for courses</p>
                  <p className="text-sm text-muted-foreground">Use your balance for approved education programs</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border bg-card p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-info/10">
                  <Shield className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Government subsidized</p>
                  <p className="text-sm text-muted-foreground">Regular top-ups based on eligibility</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Login Tabs */}
          <div className="flex items-center justify-center animate-slide-up">
            <Card className="w-full max-w-md shadow-lg">
              <Tabs defaultValue="citizen" className="w-full">
                <CardHeader className="pb-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="citizen" className="gap-2">
                      <User className="h-4 w-4" />
                      Account Holder
                    </TabsTrigger>
                    <TabsTrigger value="admin" className="gap-2">
                      <Shield className="h-4 w-4" />
                      Admin
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>

                {/* Citizen Login */}
                <TabsContent value="citizen">
                  <form onSubmit={handleCitizenLogin}>
                    <CardContent className="space-y-4">
                      <CardTitle className="text-xl">Welcome back</CardTitle>
                      <CardDescription>
                        Log in to view your Education Account balance and transactions
                      </CardDescription>
                      
                      {citizenError && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{citizenError}</AlertDescription>
                        </Alert>
                      )}
                      
                      <div className="space-y-2">
                        <Label htmlFor="citizen-email">Email</Label>
                        <Input 
                          id="citizen-email"
                          type="email"
                          placeholder="your.email@example.com"
                          value={citizenEmail}
                          onChange={(e) => setCitizenEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="citizen-password">Password</Label>
                        <Input 
                          id="citizen-password"
                          type="password"
                          placeholder="••••••••"
                          value={citizenPassword}
                          onChange={(e) => setCitizenPassword(e.target.value)}
                          required
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                      <Button type="submit" className="w-full" size="lg">
                        Log in <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        Demo: Use <code className="bg-muted px-1 rounded">weiming.tan@email.com</code>
                      </p>
                    </CardFooter>
                  </form>
                </TabsContent>

                {/* Admin Login */}
                <TabsContent value="admin">
                  <form onSubmit={handleAdminLogin}>
                    <CardContent className="space-y-4">
                      <CardTitle className="text-xl">Admin Portal</CardTitle>
                      <CardDescription>
                        Ministry of Education staff login
                      </CardDescription>
                      
                      {adminError && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{adminError}</AlertDescription>
                        </Alert>
                      )}
                      
                      <div className="space-y-2">
                        <Label htmlFor="admin-email">Email</Label>
                        <Input 
                          id="admin-email"
                          type="email"
                          placeholder="name@moe.gov.sg"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin-password">Password</Label>
                        <Input 
                          id="admin-password"
                          type="password"
                          placeholder="••••••••"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          required
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                      <Button type="submit" className="w-full" size="lg">
                        Log in <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        Demo: Use any email ending with <code className="bg-muted px-1 rounded">@moe.gov.sg</code>
                      </p>
                    </CardFooter>
                  </form>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card mt-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground">
            © 2025 Ministry of Education. All rights reserved. This is a demo application.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
