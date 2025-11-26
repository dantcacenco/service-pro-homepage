'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, XCircle, AlertCircle, RefreshCw, 
  Database, Mail, DollarSign, Clock, Activity,
  Server, Shield, Globe
} from 'lucide-react';
import { toast } from 'sonner';

interface SystemHealthDashboardProps {
  data: {
    maintenanceLogs: any[];
    emailLogs: any[];
    billcomLogs: any[];
    stats: {
      customers: number;
      proposals: number;
      jobs: number;
    };
  };
}

export default function SystemHealthDashboard({ data }: SystemHealthDashboardProps) {
  const [healthStatus, setHealthStatus] = useState<Record<string, any>>({});
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  useEffect(() => {
    checkSystemHealth();
  }, []);

  const checkSystemHealth = async () => {
    setChecking(true);
    const status: Record<string, any> = {};

    try {
      // Check Database
      const dbStart = Date.now();
      const dbResponse = await fetch('/api/health/database');
      status.database = {
        status: dbResponse.ok ? 'healthy' : 'error',
        responseTime: Date.now() - dbStart,
        message: dbResponse.ok ? 'Connected' : 'Connection failed'
      };

      // Check Email Service (Resend)
      const emailStart = Date.now();
      const emailResponse = await fetch('/api/health/email');
      const emailData = await emailResponse.json();
      status.email = {
        status: emailResponse.ok ? 'healthy' : 'error',
        responseTime: Date.now() - emailStart,
        message: emailData.message || 'Service operational'
      };

      // Check Bill.com Integration
      const billcomStart = Date.now();
      const billcomResponse = await fetch('/api/health/billcom');
      const billcomData = await billcomResponse.json();
      status.billcom = {
        status: billcomResponse.ok ? 'healthy' : 'warning',
        responseTime: Date.now() - billcomStart,
        message: billcomData.message || 'API accessible'
      };

      // Check Vercel/Hosting
      status.hosting = {
        status: 'healthy',
        responseTime: 0,
        message: 'Application running'
      };

      setHealthStatus(status);
      setLastChecked(new Date());
    } catch (error) {
      console.error('Health check error:', error);
      toast.error('Failed to complete health check');
    } finally {
      setChecking(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (date: string | Date) => {
    return new Date(date).toLocaleString('en-US', {
      timeZone: 'America/New_York',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const services = [
    { key: 'database', name: 'Database', icon: Database, description: 'Supabase PostgreSQL' },
    { key: 'email', name: 'Email Service', icon: Mail, description: 'Resend API' },
    { key: 'billcom', name: 'Bill.com', icon: DollarSign, description: 'Payment Integration' },
    { key: 'hosting', name: 'Hosting', icon: Server, description: 'Vercel Platform' }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">System Health Dashboard</h1>
            <p className="text-gray-600 mt-2">Monitor all system components and services</p>
          </div>
          <Button onClick={checkSystemHealth} disabled={checking}>
            <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking...' : 'Refresh'}
          </Button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Last checked: {formatDateTime(lastChecked)}
        </p>
      </div>

      {/* System Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {services.map((service) => {
          const status = healthStatus[service.key];
          const Icon = service.icon;
          
          return (
            <Card key={service.key}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <Icon className="h-5 w-5 text-gray-600" />
                  {status && getStatusIcon(status.status)}
                </div>
                <CardTitle className="text-lg">{service.name}</CardTitle>
                <CardDescription>{service.description}</CardDescription>
              </CardHeader>
              <CardContent>
                {status ? (
                  <div>
                    <Badge className={getStatusColor(status.status)}>
                      {status.status.toUpperCase()}
                    </Badge>
                    <p className="text-sm text-gray-600 mt-2">{status.message}</p>
                    {status.responseTime > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Response: {status.responseTime}ms
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Checking...</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Database Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.customers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Proposals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.proposals}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.jobs}</div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Logs */}
      <Tabs defaultValue="maintenance" className="w-full">
        <TabsList>
          <TabsTrigger value="maintenance">Maintenance Logs</TabsTrigger>
          <TabsTrigger value="email">Email Logs</TabsTrigger>
          <TabsTrigger value="billcom">Bill.com Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="maintenance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Maintenance Reminders</CardTitle>
              <CardDescription>Last 10 maintenance email activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.maintenanceLogs.length > 0 ? (
                  data.maintenanceLogs.map((log: any) => (
                    <div key={log.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="text-sm font-medium">{log.email_sent_to}</p>
                        <p className="text-xs text-gray-500">{formatDateTime(log.sent_at)}</p>
                      </div>
                      <Badge className={log.status === 'sent' ? 'bg-green-100' : 'bg-red-100'}>
                        {log.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No maintenance logs yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Email Activity</CardTitle>
              <CardDescription>Last 10 email sends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.emailLogs.length > 0 ? (
                  data.emailLogs.map((log: any) => (
                    <div key={log.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="text-sm font-medium">{log.recipient}</p>
                        <p className="text-xs text-gray-500">
                          {log.subject} • {formatDateTime(log.sent_at)}
                        </p>
                      </div>
                      <Badge className={log.status === 'sent' ? 'bg-green-100' : 'bg-red-100'}>
                        {log.status}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No email logs yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billcom" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Bill.com Activity</CardTitle>
              <CardDescription>Last 10 Bill.com API interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.billcomLogs.length > 0 ? (
                  data.billcomLogs.map((log: any) => (
                    <div key={log.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="text-sm font-medium">{log.action || 'API Call'}</p>
                        <p className="text-xs text-gray-500">{formatDateTime(log.created_at)}</p>
                      </div>
                      <Badge className={log.success ? 'bg-green-100' : 'bg-red-100'}>
                        {log.success ? 'Success' : 'Failed'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No Bill.com logs yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick Actions & Troubleshooting</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 border rounded">
              <h4 className="font-medium mb-2">If emails aren't sending:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Check Resend API key in environment variables</li>
                <li>• Verify domain is configured in Resend dashboard</li>
                <li>• Check email logs above for error messages</li>
              </ul>
            </div>
            <div className="p-3 border rounded">
              <h4 className="font-medium mb-2">If Bill.com sync fails:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Verify Bill.com credentials are current</li>
                <li>• Check if Bill.com API is operational</li>
                <li>• Review Bill.com logs for specific errors</li>
              </ul>
            </div>
            <div className="p-3 border rounded">
              <h4 className="font-medium mb-2">If database is slow:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Check Supabase dashboard for usage limits</li>
                <li>• Review database connection pool settings</li>
                <li>• Consider database maintenance or scaling</li>
              </ul>
            </div>
            <div className="p-3 border rounded">
              <h4 className="font-medium mb-2">Support Contacts:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Supabase: support.supabase.com</li>
                <li>• Resend: support@resend.com</li>
                <li>• Bill.com: 1-650-621-7700</li>
                <li>• Vercel: vercel.com/support</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
