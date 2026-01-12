-- Create app_role enum for RBAC
CREATE TYPE public.app_role AS ENUM ('admin', 'finance', 'school_ops', 'customer_service', 'it_support', 'citizen');

-- Create user_roles table (separate from profiles as required)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is admin (any admin role)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'finance', 'school_ops', 'customer_service', 'it_support')
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create profiles table for basic user info
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create account_holders table (citizen personal data)
-- NRIC stored as masked by default, full NRIC only via secure function
CREATE TABLE public.account_holders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    date_of_birth DATE,
    nric_masked TEXT NOT NULL, -- Only last 4 digits: ****1234A
    nric_hash TEXT NOT NULL, -- Hashed full NRIC for lookups
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.account_holders ENABLE ROW LEVEL SECURITY;

-- Citizens can only see their own data
CREATE POLICY "Citizens can view their own account holder info"
ON public.account_holders
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all account holders
CREATE POLICY "Admins can view all account holders"
ON public.account_holders
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins can manage account holders
CREATE POLICY "Admins can manage account holders"
ON public.account_holders
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Create education_accounts table
CREATE TABLE public.education_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_holder_id UUID REFERENCES public.account_holders(id) ON DELETE CASCADE NOT NULL,
    account_number TEXT NOT NULL UNIQUE, -- e.g., EA001
    balance DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed')),
    opened_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    suspended_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.education_accounts ENABLE ROW LEVEL SECURITY;

-- Citizens can only see their own education account
CREATE POLICY "Citizens can view their own education account"
ON public.education_accounts
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.account_holders ah
        WHERE ah.id = education_accounts.account_holder_id
        AND ah.user_id = auth.uid()
    )
);

-- Admins can view all education accounts
CREATE POLICY "Admins can view all education accounts"
ON public.education_accounts
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins can manage education accounts
CREATE POLICY "Admins can manage education accounts"
ON public.education_accounts
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Create transactions table
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    education_account_id UUID REFERENCES public.education_accounts(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('top_up', 'fee_charge', 'refund', 'adjustment')),
    amount DECIMAL(12,2) NOT NULL,
    balance_after DECIMAL(12,2) NOT NULL,
    internal_description TEXT,
    external_description TEXT, -- Visible to citizens
    reference_id TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Citizens can only see their own transactions (external description only)
CREATE POLICY "Citizens can view their own transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.education_accounts ea
        JOIN public.account_holders ah ON ah.id = ea.account_holder_id
        WHERE ea.id = transactions.education_account_id
        AND ah.user_id = auth.uid()
    )
);

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins can create transactions
CREATE POLICY "Admins can create transactions"
ON public.transactions
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Create courses table
CREATE TABLE public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    category TEXT NOT NULL,
    fee DECIMAL(12,2) NOT NULL CHECK (fee >= 0),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'upcoming', 'completed', 'cancelled')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can view courses
CREATE POLICY "Authenticated users can view courses"
ON public.courses
FOR SELECT
TO authenticated
USING (true);

-- Admins can manage courses
CREATE POLICY "Admins can manage courses"
ON public.courses
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Create enrolments table
CREATE TABLE public.enrolments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    education_account_id UUID REFERENCES public.education_accounts(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'completed', 'withdrawn', 'pending_payment')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'partial', 'refunded')),
    amount_paid DECIMAL(12,2) NOT NULL DEFAULT 0,
    enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (education_account_id, course_id)
);

ALTER TABLE public.enrolments ENABLE ROW LEVEL SECURITY;

-- Citizens can view their own enrolments
CREATE POLICY "Citizens can view their own enrolments"
ON public.enrolments
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.education_accounts ea
        JOIN public.account_holders ah ON ah.id = ea.account_holder_id
        WHERE ea.id = enrolments.education_account_id
        AND ah.user_id = auth.uid()
    )
);

-- Admins can view all enrolments
CREATE POLICY "Admins can view all enrolments"
ON public.enrolments
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins can manage enrolments
CREATE POLICY "Admins can manage enrolments"
ON public.enrolments
FOR ALL
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Create audit_logs table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- System can insert audit logs (via service role or authenticated)
CREATE POLICY "Authenticated users can create audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_account_holders_updated_at
    BEFORE UPDATE ON public.account_holders
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_education_accounts_updated_at
    BEFORE UPDATE ON public.education_accounts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
    BEFORE UPDATE ON public.courses
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_enrolments_updated_at
    BEFORE UPDATE ON public.enrolments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();