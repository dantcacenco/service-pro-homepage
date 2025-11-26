'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  RefreshCw,
  Save,
  TestTube,
} from 'lucide-react';

interface CredentialsStatus {
  hasEnvCredentials: boolean;
  hasDatabaseCredentials: boolean;
  usingDatabase: boolean;
  maskedUsername?: string;
}

interface CurrentCredentials {
  devKey: string;
  username: string;
  password: string;
  orgId: string;
  apiUrl: string;
}

export default function SettingsPage() {
  const [status, setStatus] = useState<CredentialsStatus | null>(null);
  const [currentCreds, setCurrentCreds] = useState<CurrentCredentials | null>(null);
  const [credSource, setCredSource] = useState<'env' | 'database'>('env');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [devKey, setDevKey] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [orgId, setOrgId] = useState('');
  const [apiUrl, setApiUrl] = useState('https://api.bill.com/api/v2');
  const [enableDatabase, setEnableDatabase] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Load current status
  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    setLoading(true);
    try {
      // Get status
      const statusRes = await fetch('/api/settings/billcom-credentials');
      const statusData = await statusRes.json();
      if (statusData.success !== false) {
        setStatus(statusData);
        setEnableDatabase(statusData.usingDatabase);
      }

      // Get current credentials (masked)
      const credsRes = await fetch('/api/settings/billcom-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-current' }),
      });
      const credsData = await credsRes.json();
      if (credsData.success) {
        setCurrentCreds(credsData.credentials);
        setCredSource(credsData.source);
        // Pre-fill form with current values (except password)
        setDevKey(credsData.credentials.devKey || '');
        setUsername(credsData.credentials.username || '');
        setOrgId(credsData.credentials.orgId || '');
        setApiUrl(credsData.credentials.apiUrl || 'https://api.bill.com/api/v2');
      }
    } catch (error) {
      console.error('Error loading status:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  }

  async function handleTest() {
    if (!devKey || !username || !password || !orgId) {
      setMessage({ type: 'error', text: 'Please fill in all credential fields' });
      return;
    }

    setTesting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/settings/billcom-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          credentials: { devKey, username, password, orgId, apiUrl },
        }),
      });

      const data = await res.json();
      setMessage({
        type: data.success ? 'success' : 'error',
        text: data.message || data.error,
      });
    } catch (error) {
      setMessage({ type: 'error', text: 'Test failed - network error' });
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    if (!devKey || !username || !password || !orgId) {
      setMessage({ type: 'error', text: 'Please fill in all credential fields' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/settings/billcom-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          credentials: { devKey, username, password, orgId, apiUrl },
          enableDatabaseCredentials: enableDatabase,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: 'success', text: 'Credentials saved successfully!' });
        await loadStatus(); // Refresh status
        setPassword(''); // Clear password field
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to save' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Save failed - network error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleSource(enabled: boolean) {
    try {
      const res = await fetch('/api/settings/billcom-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle-source', enabled }),
      });

      const data = await res.json();
      if (data.success) {
        setEnableDatabase(enabled);
        setMessage({
          type: 'success',
          text: enabled ? 'Now using database credentials' : 'Now using environment variables',
        });
        await loadStatus();
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to toggle source' });
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      {/* Status Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Bill.com Connection Status
            <Button variant="ghost" size="sm" onClick={loadStatus}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardTitle>
          <CardDescription>Current Bill.com API connection configuration</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              {status?.hasEnvCredentials ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-gray-300" />
              )}
              <span className="text-sm">Env Variables</span>
            </div>
            <div className="flex items-center gap-2">
              {status?.hasDatabaseCredentials ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-gray-300" />
              )}
              <span className="text-sm">Database</span>
            </div>
            <div className="col-span-2">
              <span className="text-sm text-muted-foreground">
                Currently using:{' '}
                <strong className="text-foreground">
                  {credSource === 'database' ? 'Database' : 'Environment Variables'}
                </strong>
              </span>
            </div>
          </div>

          {currentCreds && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm">
                <strong>Username:</strong> {currentCreds.username}
              </p>
              <p className="text-sm">
                <strong>Org ID:</strong> {currentCreds.orgId}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Alert */}
      {message && (
        <Alert className={`mb-6 ${message.type === 'error' ? 'border-red-500' : 'border-green-500'}`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Credentials Form */}
      <Card>
        <CardHeader>
          <CardTitle>Bill.com API Credentials</CardTitle>
          <CardDescription>
            Update your Bill.com API credentials. Changes will be encrypted and stored securely.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username (Email)</Label>
              <Input
                id="username"
                type="email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="service@fairairhc.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="devKey">Developer Key</Label>
              <Input
                id="devKey"
                type="text"
                value={devKey}
                onChange={(e) => setDevKey(e.target.value)}
                placeholder="01XJGFKNSCOWLOBP3558"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orgId">Organization ID</Label>
              <Input
                id="orgId"
                type="text"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
                placeholder="00802NDQRPKOEFQ2uzy3"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="apiUrl">API URL</Label>
              <Input
                id="apiUrl"
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://api.bill.com/api/v2"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-4 border-t">
            <Switch
              id="enable-database"
              checked={enableDatabase}
              onCheckedChange={handleToggleSource}
            />
            <Label htmlFor="enable-database" className="text-sm">
              Use database credentials (instead of environment variables)
            </Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={handleTest} disabled={testing || saving}>
              {testing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              Test Connection
            </Button>

            <Button onClick={handleSave} disabled={saving || testing}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save to Database
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            Note: Credentials are encrypted before being stored in the database. When using database
            credentials, you can update them here without modifying environment variables or
            redeploying.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
