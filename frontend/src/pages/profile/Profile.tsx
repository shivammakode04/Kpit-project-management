import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Mail, User, Calendar, Award, Zap } from 'lucide-react';

export function Profile() {
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    try {
      setLoading(true);
      await authApi.updateProfile({ full_name: fullName, email });
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const statsData = [
    { name: 'Completed', value: 42 },
    { name: 'In Progress', value: 8 },
    { name: 'Pending', value: 5 },
  ];

  const projectsData = [
    { name: 'Website Redesign', value: 35 },
    { name: 'Mobile App', value: 28 },
    { name: 'API Development', value: 37 },
  ];

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b'];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-gray-600 mt-1">Manage your account and view your statistics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={user?.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {user?.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="text-center">
              <h3 className="font-semibold text-lg">{user?.full_name || user?.username}</h3>
              <Badge className="mt-2">{user?.role}</Badge>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">@{user?.username}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">{user?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">
                  Joined {new Date(user?.created_at || '').toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Profile Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Full Name</label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>

            <Button onClick={handleSave} disabled={loading} className="w-full">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-green-600" />
              Tasks Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">42</div>
            <p className="text-xs text-gray-500 mt-1">+5 this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-600" />
              Projects Contributed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3</div>
            <p className="text-xs text-gray-500 mt-1">Active projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-600" />
              Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12</div>
            <p className="text-xs text-gray-500 mt-1">Days active</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Task Distribution</CardTitle>
            <CardDescription>Your task status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={statsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project Contribution</CardTitle>
            <CardDescription>Tasks per project</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={projectsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {projectsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your recent actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: 'Completed task', project: 'Website Redesign', time: '2 hours ago' },
              { action: 'Started task', project: 'Mobile App', time: '5 hours ago' },
              { action: 'Joined project', project: 'API Development', time: '1 day ago' },
            ].map((item, idx) => (
              <div key={idx} className="flex items-center justify-between pb-4 border-b last:border-0">
                <div>
                  <p className="font-medium text-sm">{item.action}</p>
                  <p className="text-xs text-gray-500">{item.project}</p>
                </div>
                <span className="text-xs text-gray-400">{item.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
