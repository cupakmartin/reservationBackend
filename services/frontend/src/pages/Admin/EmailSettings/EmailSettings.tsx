// services/frontend/src/pages/Admin/EmailSettings/EmailSettings.tsx
import { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Modal from '../../../components/ui/Modal';
import api from '../../../lib/api';

interface EmailTemplate {
  _id: string;
  trigger: string;
  subject: string;
  htmlTemplate: string;
  enabled: boolean;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

interface TemplateFormData {
  subject: string;
  htmlTemplate: string;
  enabled: boolean;
  roles: string[];
}

const TRIGGER_LABELS: Record<string, string> = {
  BOOKING_CREATED: 'Booking Created',
  BOOKING_CONFIRMED: 'Booking Confirmed',
  BOOKING_COMPLETED: 'Booking Completed',
  UPCOMING_BOOKING: 'Upcoming Booking Reminder'
};

const TRIGGER_DESCRIPTIONS: Record<string, string> = {
  BOOKING_CREATED: 'Sent when a new booking is created',
  BOOKING_CONFIRMED: 'Sent when a booking is confirmed by staff',
  BOOKING_COMPLETED: 'Sent to admin when a booking is marked as completed',
  UPCOMING_BOOKING: 'Daily reminder sent at 8 AM for today\'s bookings'
};

export default function EmailSettings() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<TemplateFormData>({
    subject: '',
    htmlTemplate: '',
    enabled: true,
    roles: []
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/email-templates');
      setTemplates(response.data.templates || []);
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to fetch email templates');
      console.error('Error fetching templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setFormData({
      subject: template.subject,
      htmlTemplate: template.htmlTemplate,
      enabled: template.enabled,
      roles: [...template.roles]
    });
    setFormErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTemplate(null);
    setFormData({
      subject: '',
      htmlTemplate: '',
      enabled: true,
      roles: []
    });
    setFormErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.subject || formData.subject.trim().length === 0) {
      errors.subject = 'Subject is required';
    }

    if (!formData.htmlTemplate || formData.htmlTemplate.trim().length === 0) {
      errors.htmlTemplate = 'Email body is required';
    }

    if (formData.roles.length === 0) {
      errors.roles = 'At least one recipient role must be selected';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!editingTemplate || !validateForm()) return;

    try {
      setSaving(true);
      await api.put(`/admin/email-templates/${editingTemplate.trigger}`, formData);
      await fetchTemplates();
      closeModal();
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setFormErrors({
        submit: error.response?.data?.error || 'Failed to update template'
      });
      console.error('Error updating template:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleRole = (role: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading email templates...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="text-red-800 font-medium">Error</div>
          <div className="text-red-600 mt-1">{error}</div>
          <Button onClick={fetchTemplates} variant="secondary" className="mt-4">
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Email Settings</h1>
        <p className="text-gray-600 mt-2">
          Configure automated email notifications and reminders
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((template) => (
          <Card key={template._id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {TRIGGER_LABELS[template.trigger] || template.trigger}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {TRIGGER_DESCRIPTIONS[template.trigger] || 'Email notification'}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                template.enabled 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {template.enabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="text-sm">
                <span className="text-gray-500">Subject:</span>
                <div className="text-gray-900 mt-1 font-medium truncate">
                  {template.subject}
                </div>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Recipients:</span>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {template.roles.map(role => (
                    <span 
                      key={role}
                      className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded text-xs font-medium capitalize"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <Button 
              onClick={() => openEditModal(template)}
              variant="secondary"
              className="w-full"
            >
              Edit Template
            </Button>
          </Card>
        ))}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingTemplate ? TRIGGER_LABELS[editingTemplate.trigger] : 'Edit Template'}
      >
        <div className="space-y-4">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Enable Notifications</div>
              <div className="text-sm text-gray-600">
                {formData.enabled ? 'Emails will be sent' : 'Emails are disabled'}
              </div>
            </div>
            <button
              onClick={() => setFormData(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.enabled ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Recipients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Send To *
            </label>
            <div className="space-y-2">
              {['client', 'worker', 'admin'].map(role => (
                <label key={role} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.roles.includes(role)}
                    onChange={() => toggleRole(role)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-gray-700 capitalize">{role}</span>
                </label>
              ))}
            </div>
            {formErrors.roles && (
              <p className="text-sm text-red-600 mt-1">{formErrors.roles}</p>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject Line *
            </label>
            <Input
              value={formData.subject}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Enter email subject..."
              error={formErrors.subject}
            />
            <p className="text-xs text-gray-500 mt-1">
              Use {'{{}}'} for dynamic values (e.g., {'{{clientName}}'}, {'{{date}}'})
            </p>
          </div>

          {/* HTML Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Body (HTML) *
            </label>
            <textarea
              value={formData.htmlTemplate}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, htmlTemplate: e.target.value }))}
              rows={12}
              className={`w-full px-3 py-2 border rounded-lg font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                formErrors.htmlTemplate ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter HTML template..."
            />
            {formErrors.htmlTemplate && (
              <p className="text-sm text-red-600 mt-1">{formErrors.htmlTemplate}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Available placeholders: {'{{clientName}}'}, {'{{workerName}}'}, {'{{procedureName}}'}, {'{{date}}'}, {'{{time}}'}, {'{{price}}'}
            </p>
          </div>

          {formErrors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{formErrors.submit}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              onClick={closeModal}
              variant="secondary"
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
