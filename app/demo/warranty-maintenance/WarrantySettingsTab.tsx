'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'

interface WarrantySettingsTabProps {
  settings: any
}

export default function WarrantySettingsTab({ settings }: WarrantySettingsTabProps) {
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    maintenance_only_price: settings?.maintenance_only_price || 200.00,
    warranty_only_price: settings?.warranty_only_price || 365.00,
    both_bundled_price: settings?.both_bundled_price || 500.00,
    warranty_offer_email_subject: settings?.warranty_offer_email_subject || 'Protect Your Investment with Fair Air Warranty',
    warranty_offer_email_body: settings?.warranty_offer_email_body || '',
    maintenance_reminder_subject: settings?.maintenance_reminder_subject || 'Time for Your Bi-Annual Maintenance',
    maintenance_reminder_body: settings?.maintenance_reminder_body || '',
    renewal_reminder_subject: settings?.renewal_reminder_subject || 'Renew Your Fair Air Warranty',
    renewal_reminder_body: settings?.renewal_reminder_body || '',
    warranty_terms: settings?.warranty_terms || '',
    maintenance_scope: settings?.maintenance_scope || '',
    exclusions: settings?.exclusions || ''
  })

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/warranty/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      toast({
        title: 'Settings saved',
        description: 'Warranty settings have been updated successfully.'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Pricing Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing Configuration</CardTitle>
          <CardDescription>
            Set default annual prices for warranty contracts. These can be customized per contract.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maintenance_only_price">Maintenance Only</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5">$</span>
                <Input
                  id="maintenance_only_price"
                  type="number"
                  step="0.01"
                  className="pl-7"
                  value={formData.maintenance_only_price}
                  onChange={(e) => setFormData({ ...formData, maintenance_only_price: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="warranty_only_price">Warranty Only</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5">$</span>
                <Input
                  id="warranty_only_price"
                  type="number"
                  step="0.01"
                  className="pl-7"
                  value={formData.warranty_only_price}
                  onChange={(e) => setFormData({ ...formData, warranty_only_price: parseFloat(e.target.value) })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="both_bundled_price">Maintenance + Warranty Bundle</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5">$</span>
                <Input
                  id="both_bundled_price"
                  type="number"
                  step="0.01"
                  className="pl-7"
                  value={formData.both_bundled_price}
                  onChange={(e) => setFormData({ ...formData, both_bundled_price: parseFloat(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Synchrony Bank financing integration coming soon - placeholder link available in warranty offers.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Email Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Email Templates</CardTitle>
          <CardDescription>
            Customize email templates for warranty offers, maintenance reminders, and renewals.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="warranty_offer_email_subject">Warranty Offer Email Subject</Label>
            <Input
              id="warranty_offer_email_subject"
              value={formData.warranty_offer_email_subject}
              onChange={(e) => setFormData({ ...formData, warranty_offer_email_subject: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="warranty_offer_email_body">Warranty Offer Email Body</Label>
            <Textarea
              id="warranty_offer_email_body"
              rows={4}
              value={formData.warranty_offer_email_body}
              onChange={(e) => setFormData({ ...formData, warranty_offer_email_body: e.target.value })}
              placeholder="Email body content..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenance_reminder_subject">Maintenance Reminder Subject</Label>
            <Input
              id="maintenance_reminder_subject"
              value={formData.maintenance_reminder_subject}
              onChange={(e) => setFormData({ ...formData, maintenance_reminder_subject: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenance_reminder_body">Maintenance Reminder Body</Label>
            <Textarea
              id="maintenance_reminder_body"
              rows={4}
              value={formData.maintenance_reminder_body}
              onChange={(e) => setFormData({ ...formData, maintenance_reminder_body: e.target.value })}
              placeholder="Reminder email content..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="renewal_reminder_subject">Renewal Reminder Subject</Label>
            <Input
              id="renewal_reminder_subject"
              value={formData.renewal_reminder_subject}
              onChange={(e) => setFormData({ ...formData, renewal_reminder_subject: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="renewal_reminder_body">Renewal Reminder Body</Label>
            <Textarea
              id="renewal_reminder_body"
              rows={4}
              value={formData.renewal_reminder_body}
              onChange={(e) => setFormData({ ...formData, renewal_reminder_body: e.target.value })}
              placeholder="Renewal email content..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Terms & Conditions */}
      <Card>
        <CardHeader>
          <CardTitle>Terms & Conditions</CardTitle>
          <CardDescription>
            Define warranty coverage terms, maintenance scope, and exclusions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="warranty_terms">Warranty Terms</Label>
            <Textarea
              id="warranty_terms"
              rows={4}
              value={formData.warranty_terms}
              onChange={(e) => setFormData({ ...formData, warranty_terms: e.target.value })}
              placeholder="Warranty coverage terms..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenance_scope">Maintenance Scope</Label>
            <Textarea
              id="maintenance_scope"
              rows={4}
              value={formData.maintenance_scope}
              onChange={(e) => setFormData({ ...formData, maintenance_scope: e.target.value })}
              placeholder="What's included in maintenance visits..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exclusions">Exclusions</Label>
            <Textarea
              id="exclusions"
              rows={4}
              value={formData.exclusions}
              onChange={(e) => setFormData({ ...formData, exclusions: e.target.value })}
              placeholder="What's not covered..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}
