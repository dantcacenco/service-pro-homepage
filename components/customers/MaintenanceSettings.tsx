'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Clock, Mail, Save, Edit3 } from 'lucide-react';

interface MaintenanceSettingsProps {
  customer: {
    id: string;
    name: string;
    email: string;
    maintenance_enabled: boolean;
    maintenance_frequency: string;
    last_maintenance_sent: string | null;
    next_maintenance_due: string | null;
  };
}

export default function MaintenanceSettings({ customer }: MaintenanceSettingsProps) {
  const [enabled, setEnabled] = useState(customer.maintenance_enabled || false);
  const [frequency, setFrequency] = useState(customer.maintenance_frequency || '6_months');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState('');
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [loadingTemplate, setLoadingTemplate] = useState(true);
  const supabase = createClient();

  // Eastern Time zone formatting
  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        timeZone: 'America/New_York',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Load email template on mount
  useEffect(() => {
    loadEmailTemplate();
  }, []);

  const loadEmailTemplate = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'maintenance_email_template')
        .single();

      if (data) {
        setEmailTemplate(data.value || getDefaultTemplate());
      } else {
        setEmailTemplate(getDefaultTemplate());
      }
    } catch (error) {
      console.error('Error loading template:', error);
      setEmailTemplate(getDefaultTemplate());
    } finally {
      setLoadingTemplate(false);
    }
  };

  const getDefaultTemplate = () => {
    return `Hi {{customer_name}},

It's time for your routine HVAC maintenance! Regular maintenance keeps your system running efficiently and helps prevent unexpected breakdowns.

Please reply to this email or call us to schedule your maintenance appointment at your convenience.

Best regards,
{{business_name}}`;
  };

  const calculateNextDueDate = (freq: string) => {
    const now = new Date();
    switch (freq) {
      case '5_minutes':
        return new Date(now.getTime() + 5 * 60 * 1000).toISOString();
      case '6_months':
        const sixMonths = new Date(now);
        sixMonths.setMonth(sixMonths.getMonth() + 6);
        return sixMonths.toISOString();
      case '12_months':
        const oneYear = new Date(now);
        oneYear.setFullYear(oneYear.getFullYear() + 1);
        return oneYear.toISOString();
      default:
        const defaultSix = new Date(now);
        defaultSix.setMonth(defaultSix.getMonth() + 6);
        return defaultSix.toISOString();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    console.log('Saving maintenance settings:', { enabled, frequency, customerId: customer.id });
    
    try {
      let nextDue = null;
      
      if (enabled) {
        nextDue = calculateNextDueDate(frequency);
        console.log('Calculated next due date:', nextDue);
      }

      const updateData = {
        maintenance_enabled: enabled,
        maintenance_frequency: frequency,
        next_maintenance_due: nextDue
      };

      console.log('Updating customer with:', updateData);

      const { data, error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', customer.id)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Update successful:', data);
      
      customer.maintenance_enabled = enabled;
      customer.maintenance_frequency = frequency;
      customer.next_maintenance_due = nextDue;
      
      toast.success('Maintenance settings updated successfully');
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error: any) {
      console.error('Failed to update settings:', error);
      toast.error(`Failed to update settings: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTemplate = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'maintenance_email_template',
          value: emailTemplate,
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

      if (error) throw error;

      toast.success('Email template updated for all customers');
      setShowTemplateEditor(false);
    } catch (error: any) {
      toast.error('Failed to update email template');
      console.error('Template save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!enabled) {
      toast.error('Please enable reminders first');
      return;
    }

    setTesting(true);
    try {
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          maintenance_enabled: true,
          next_maintenance_due: new Date().toISOString()
        })
        .eq('id', customer.id);

      if (updateError) {
        throw updateError;
      }

      const response = await fetch('/api/maintenance/check-reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      console.log('Test email result:', result);
      
      if (result.sent && result.sent > 0) {
        toast.success('Test email sent successfully!');
        
        const nextDue = calculateNextDueDate(frequency);
        await supabase
          .from('customers')
          .update({
            next_maintenance_due: nextDue,
            last_maintenance_sent: new Date().toISOString()
          })
          .eq('id', customer.id);
          
      } else if (result.processed === 0) {
        toast.error('Email not sent - check if global reminders are enabled in settings');
      } else {
        toast.error('Failed to send test email - check email configuration');
      }
    } catch (error: any) {
      toast.error('Failed to send test email');
      console.error('Test email error:', error);
    } finally {
      setTesting(false);
    }
  };

  // Preview the email with actual values
  const getEmailPreview = () => {
    return emailTemplate
      .replace('{{customer_name}}', customer.name || 'Valued Customer')
      .replace('{{business_name}}', 'Fair Air HVAC');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Maintenance Reminders
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="maintenance-enabled">Enable Reminders</Label>
          <Switch
            id="maintenance-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="frequency">Reminder Frequency</Label>
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger id="frequency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5_minutes">Every 5 Minutes (Testing)</SelectItem>
              <SelectItem value="6_months">Every 6 Months</SelectItem>
              <SelectItem value="12_months">Every 12 Months</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1 text-sm">
          <div>
            <span className="text-gray-500">Last Sent:</span>{' '}
            <span>{formatDateTime(customer.last_maintenance_sent)}</span>
          </div>
          <div>
            <span className="text-gray-500">Next Due:</span>{' '}
            <span className="font-medium">
              {enabled ? formatDateTime(customer.next_maintenance_due) : 'Disabled'}
            </span>
          </div>
        </div>

        {/* Email Template Editor Section */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <Label>Email Template (All Customers)</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplateEditor(!showTemplateEditor)}
            >
              <Edit3 className="h-4 w-4 mr-2" />
              {showTemplateEditor ? 'Hide' : 'Edit Template'}
            </Button>
          </div>
          
          {showTemplateEditor && (
            <div className="space-y-3">
              <Textarea
                value={emailTemplate}
                onChange={(e) => setEmailTemplate(e.target.value)}
                rows={8}
                className="font-mono text-sm"
                placeholder="Enter email template..."
              />
              <div className="text-xs text-gray-500">
                Available variables: {'{{customer_name}}'}, {'{{business_name}}'}
              </div>
              
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-xs font-semibold text-gray-600 mb-2">Preview:</p>
                <div className="text-sm whitespace-pre-wrap">{getEmailPreview()}</div>
              </div>
              
              <Button onClick={handleSaveTemplate} disabled={saving} size="sm">
                Save Template for All Customers
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
          
          {enabled && customer.email && (
            <Button
              variant="outline"
              onClick={handleTestEmail}
              disabled={testing}
            >
              <Mail className="h-4 w-4 mr-2" />
              {testing ? 'Sending...' : 'Send Test Email'}
            </Button>
          )}
        </div>

        {!customer.email && enabled && (
          <p className="text-sm text-yellow-600">
            ⚠️ No email address on file for this customer
          </p>
        )}
      </CardContent>
    </Card>
  );
}
