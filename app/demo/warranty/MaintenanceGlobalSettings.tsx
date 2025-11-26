'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Save, Mail } from 'lucide-react';

interface MaintenanceGlobalSettingsProps {
  initialSettings: {
    maintenance_reminders_enabled?: string;
    maintenance_email_template?: string;
  };
}

export default function MaintenanceGlobalSettings({ initialSettings }: MaintenanceGlobalSettingsProps) {
  const [enabled, setEnabled] = useState(initialSettings.maintenance_reminders_enabled === 'true');
  const [template, setTemplate] = useState(initialSettings.maintenance_email_template || 
    `Hi {{customer_name}},

It's time for your routine HVAC maintenance! Regular maintenance keeps your system running efficiently and helps prevent unexpected breakdowns.

Please reply to this email or call us to schedule your maintenance appointment at your convenience.

Best regards,
{{business_name}}`);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update enabled setting
      await supabase
        .from('app_settings')
        .upsert({
          key: 'maintenance_reminders_enabled',
          value: enabled.toString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      // Update email template
      await supabase
        .from('app_settings')
        .upsert({
          key: 'maintenance_email_template',
          value: template,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error('Failed to update settings');
      console.error('Settings update error:', error);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Global Maintenance Reminder Settings
        </CardTitle>
        <CardDescription>
          Configure maintenance reminder emails for all customers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="global-enabled">Enable Maintenance Reminders</Label>
            <p className="text-sm text-muted-foreground">
              Master switch for all maintenance reminders
            </p>
          </div>
          <Switch
            id="global-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email-template">Email Template</Label>
          <Textarea
            id="email-template"
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            rows={8}
            placeholder="Enter email template..."
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Available variables: {'{{customer_name}}'}, {'{{business_name}}'}
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-yellow-800 mb-2">How it works:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Reminders are checked when the dashboard loads</li>
            <li>• Each customer can have their own frequency setting (5 min, 6 mo, 12 mo)</li>
            <li>• Reminders must be enabled both globally and per-customer</li>
            <li>• The system tracks when each reminder was sent to avoid duplicates</li>
          </ul>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardContent>
    </Card>
  );
}
