import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Save, AlertCircle } from 'lucide-react';
import { CitizenLayout } from '@/components/layouts/CitizenLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  getAccountHolder,
  formatDate,
  getSchoolingLabel
} from '@/lib/data';
import { toast } from '@/hooks/use-toast';

const ProfilePage: React.FC = () => {
  const { citizenUser } = useAuth();
  const holder = citizenUser ? getAccountHolder(citizenUser.id) : null;
  
  const [phone, setPhone] = useState(holder?.phone || '');
  const [email, setEmail] = useState(holder?.email || '');
  const [address, setAddress] = useState(holder?.address || '');
  const [isEditing, setIsEditing] = useState(false);

  if (!holder) {
    return (
      <CitizenLayout>
        <div className="text-center py-16">
          <p>Profile not found</p>
        </div>
      </CitizenLayout>
    );
  }

  const handleSave = () => {
    toast({
      title: "Profile Updated",
      description: "Your contact details have been updated successfully.",
    });
    setIsEditing(false);
  };

  return (
    <CitizenLayout>
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">My Details</h1>
        <p className="mt-1 text-muted-foreground">
          View and update your personal information
        </p>
      </div>

      {/* Profile Header */}
      <Card className="mb-6 animate-slide-up">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <span className="text-2xl font-bold text-primary">
                {holder.firstName[0]}{holder.lastName[0]}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {holder.firstName} {holder.lastName}
              </h2>
              <p className="text-muted-foreground">Account Holder ID: {holder.id}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Member since {formatDate(holder.createdAt)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information (Read-only) */}
        <Card className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              This information is managed by the Ministry of Education
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                To update these details, please contact the Ministry of Education.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Full Name</Label>
                <p className="font-medium mt-1">{holder.firstName} {holder.lastName}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Date of Birth</Label>
                <p className="font-medium mt-1">{formatDate(holder.dateOfBirth)} ({holder.age} years old)</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Schooling Status</Label>
                <p className="font-medium mt-1">{getSchoolingLabel(holder.schoolingStatus)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information (Editable) */}
        <Card className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Contact Information
                </CardTitle>
                <CardDescription>
                  You can update these details
                </CardDescription>
              </div>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isEditing}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!isEditing}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={!isEditing}
                  className="pl-10"
                />
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsEditing(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSave} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CitizenLayout>
  );
};

export default ProfilePage;
