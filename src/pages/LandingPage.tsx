import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, Shield, ArrowRight, User, Lock, AlertCircle, Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signUp, loading: authLoading } = useAuth();
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Signup state
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    
    try {
      const result = await signIn(loginEmail, loginPassword);
      
      if (result.success && result.portal) {
        navigate(result.portal === 'admin' ? '/admin' : '/portal');
      } else {
        setLoginError(result.error || 'Login failed');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    setSignupSuccess('');
    
    // Validate password
    if (signupPassword.length < 6) {
      setSignupError('Password must be at least 6 characters');
      return;
    }
    
    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match');
      return;
    }
    
    setSignupLoading(true);
    
    try {
      // Default to citizen role for self-registration
      const result = await signUp(signupEmail, signupPassword, 'citizen');
      
      if (result.success) {
        setSignupSuccess('Account created successfully! You can now log in.');
        setSignupEmail('');
        setSignupPassword('');
        setSignupConfirmPassword('');
        // Switch to login tab after successful signup
        setTimeout(() => setActiveTab('login'), 2000);
      } else {
        setSignupError(result.error || 'Sign up failed');
      }
    } finally {
      setSignupLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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

          {/* Right: Auth Tabs */}
          <div className="flex items-center justify-center animate-slide-up">
            <Card className="w-full max-w-md shadow-lg">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <CardHeader className="pb-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login" className="gap-2">
                      <User className="h-4 w-4" />
                      Log In
                    </TabsTrigger>
                    <TabsTrigger value="signup" className="gap-2">
                      <UserPlus className="h-4 w-4" />
                      Sign Up
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>

                {/* Login Tab */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                      <CardTitle className="text-xl">Welcome back</CardTitle>
                      <CardDescription>
                        Log in to access your Education Account
                      </CardDescription>
                      
                      {loginError && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{loginError}</AlertDescription>
                        </Alert>
                      )}
                      
                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <Input 
                          id="login-email"
                          type="email"
                          placeholder="your.email@example.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                          disabled={loginLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <Input 
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                          disabled={loginLoading}
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                      <Button type="submit" className="w-full" size="lg" disabled={loginLoading}>
                        {loginLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Logging in...
                          </>
                        ) : (
                          <>
                            Log in <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </TabsContent>

                {/* Signup Tab */}
                <TabsContent value="signup">
                  <form onSubmit={handleSignup}>
                    <CardContent className="space-y-4">
                      <CardTitle className="text-xl">Create Account</CardTitle>
                      <CardDescription>
                        Sign up for an Education Account
                      </CardDescription>
                      
                      {signupError && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{signupError}</AlertDescription>
                        </Alert>
                      )}
                      
                      {signupSuccess && (
                        <Alert className="border-success bg-success/10">
                          <AlertDescription className="text-success">{signupSuccess}</AlertDescription>
                        </Alert>
                      )}
                      
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <Input 
                          id="signup-email"
                          type="email"
                          placeholder="your.email@example.com"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          required
                          disabled={signupLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password</Label>
                        <Input 
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          value={signupPassword}
                          onChange={(e) => setSignupPassword(e.target.value)}
                          required
                          minLength={6}
                          disabled={signupLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                        <Input 
                          id="signup-confirm-password"
                          type="password"
                          placeholder="••••••••"
                          value={signupConfirmPassword}
                          onChange={(e) => setSignupConfirmPassword(e.target.value)}
                          required
                          minLength={6}
                          disabled={signupLoading}
                        />
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                      <Button type="submit" className="w-full" size="lg" disabled={signupLoading}>
                        {signupLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          <>
                            Create Account <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        By signing up, you agree to our terms of service
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
            © 2025 Ministry of Education. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
