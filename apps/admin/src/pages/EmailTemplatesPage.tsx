import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '../services/api';
import Modal from '../components/ui/Modal';
import { TableSkeleton } from '../components/ui/Spinner';
import {
  Mail, Code, Eye, Send, Save, CheckCircle2,
  Sparkles, RefreshCw, AlertCircle, HelpCircle, Copy
} from 'lucide-react';
import type { EmailTemplate } from '@ecommerce/shared-types';

const PLACEHOLDERS_BY_KEY: Record<string, Array<{ code: string; label: string }>> = {
  inquiry_confirmation: [
    { code: '{{customer_name}}', label: 'Client Name' },
    { code: '{{inquiry_number}}', label: 'Inquiry Ref #' },
    { code: '{{subject}}', label: 'Subject' },
    { code: '{{category}}', label: 'Category' },
    { code: '{{message}}', label: 'Message' },
  ],
  inquiry_reply: [
    { code: '{{customer_name}}', label: 'Client Name' },
    { code: '{{inquiry_number}}', label: 'Inquiry Ref #' },
    { code: '{{subject}}', label: 'Subject' },
    { code: '{{sender_name}}', label: 'Agent Name' },
    { code: '{{reply_message}}', label: 'Reply Body' },
  ],
  order_confirmation_invoice: [
    { code: '{{customer_name}}', label: 'Customer Name' },
    { code: '{{order_id}}', label: 'Order ID' },
    { code: '{{order_number}}', label: 'Order Ref #' },
    { code: '{{subtotal_amount}}', label: 'Subtotal ($)' },
    { code: '{{total_amount}}', label: 'Total ($)' },
    { code: '{{shipping_address}}', label: 'Shipping Address' },
    { code: '{{items_table_html}}', label: 'Itemized HTML Table' },
  ],
  order_status_shipped: [
    { code: '{{customer_name}}', label: 'Customer Name' },
    { code: '{{order_id}}', label: 'Order ID' },
    { code: '{{carrier}}', label: 'Shipping Carrier' },
    { code: '{{tracking_number}}', label: 'Tracking #' },
    { code: '{{shipping_address}}', label: 'Shipping Address' },
  ],
};

const SAMPLE_VARS: Record<string, string> = {
  customer_name: 'John Doe',
  inquiry_number: 'INQ-2026-1001',
  subject: 'Sample Product Inquiry',
  category: 'General Client Query',
  message: 'This is a sample test inquiry message submitted from the StoreCo website.',
  sender_name: 'Support Agent (StoreCo)',
  reply_message: 'Thank you for reaching out! We have processed your request and attached the required information.',
  order_id: '1001',
  order_number: 'ORD-2026-1001',
  subtotal_amount: '129.99',
  total_amount: '129.99',
  shipping_address: '123 Test Street, Suite 100, San Francisco, CA 94105',
  carrier: 'FedEx Express',
  tracking_number: 'TRK-9842104928',
  items_table_html: `
    <table style="width:100%; border-collapse:collapse; margin:16px 0;">
      <thead>
        <tr style="background:#f8fafc; border-bottom:2px solid #e2e8f0;">
          <th style="padding:8px 12px; font-size:11px; text-transform:uppercase; color:#64748b; text-align:left;">Item</th>
          <th style="padding:8px 12px; font-size:11px; text-transform:uppercase; color:#64748b; text-align:center;">Qty</th>
          <th style="padding:8px 12px; font-size:11px; text-transform:uppercase; color:#64748b; text-align:right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9; font-weight:500;">Azyyau Premium T-Shirt (Large)</td>
          <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9; text-align:center; font-weight:600;">2</td>
          <td style="padding:10px 12px; border-bottom:1px solid #f1f5f9; text-align:right; font-weight:600;">$129.99</td>
        </tr>
      </tbody>
    </table>
  `,
};

function renderSampleHtml(templateStr: string): string {
  if (!templateStr) return '';
  return templateStr.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    return SAMPLE_VARS[key] !== undefined ? SAMPLE_VARS[key]! : `{{${key}}}`;
  });
}

export default function EmailTemplatesPage() {
  const qc = useQueryClient();
  const [selectedKey, setSelectedKey] = useState<string>('inquiry_confirmation');
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('preview');

  // Form states for active template
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Test email modal state
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: async () => {
      const { data } = await api.get('/email-templates');
      return data.data as EmailTemplate[];
    },
  });

  const activeTemplate = useMemo(() => {
    return templates.find((t) => t.key === selectedKey) || templates[0];
  }, [templates, selectedKey]);

  // Sync state when selected template changes
  useMemo(() => {
    if (activeTemplate) {
      setSubject(activeTemplate.subject);
      setHtmlContent(activeTemplate.html_content);
      setIsActive(activeTemplate.is_active);
    }
  }, [activeTemplate]);

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: (body: object) => api.put(`/email-templates/${selectedKey}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success(`Email template '${selectedKey}' saved successfully`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save template');
    },
  });

  // Test Send Mutation
  const testSendMutation = useMutation({
    mutationFn: (to: string) => api.post(`/email-templates/${selectedKey}/test-send`, { to }),
    onSuccess: () => {
      setTestModalOpen(false);
      setTestRecipient('');
      toast.success(`Test email sent to ${testRecipient}`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to send test email');
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      subject,
      html_content: htmlContent,
      is_active: isActive,
    });
  };

  const copyPlaceholder = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.info(`Copied placeholder: ${code}`);
  };

  const renderedPreview = useMemo(() => {
    return renderSampleHtml(htmlContent);
  }, [htmlContent]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Mail className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            System Email Templates
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Design, edit, and live-preview HTML email templates for inquiry confirmations, staff replies, and itemized order invoices.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTestModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-50 flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Send className="w-3.5 h-3.5 text-indigo-500" /> Send Test Email
          </button>
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {updateMutation.isPending ? 'Saving…' : 'Save Template'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={6} cols={4} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar: Template Selection Cards */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 px-1">
              Select Email Trigger Template
            </h3>

            <div className="space-y-2.5">
              {templates.map((tpl) => {
                const isSelected = tpl.key === selectedKey;
                return (
                  <div
                    key={tpl.key}
                    onClick={() => setSelectedKey(tpl.key)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-950/20 shadow-sm'
                        : 'border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{tpl.name}</span>
                      <span className={`px-2 py-0.5 text-2xs font-bold rounded-full uppercase ${
                        tpl.is_active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {tpl.is_active ? 'Active' : 'Disabled'}
                      </span>
                    </div>

                    <p className="text-2xs text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2">
                      {tpl.description}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-2xs font-mono text-slate-400">
                      <span>key: {tpl.key}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Main Editor & Preview Pane */}
          <div className="lg:col-span-8 space-y-4">
            {activeTemplate && (
              <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden p-5 space-y-4">
                {/* Active Template Meta bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">{activeTemplate.name}</h2>
                    <p className="text-2xs text-slate-400 mt-0.5">{activeTemplate.description}</p>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Enable Trigger
                  </label>
                </div>

                {/* Email Subject Line */}
                <div>
                  <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Email Subject Line
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    placeholder="Subject line with {{placeholders}}…"
                  />
                </div>

                {/* Dynamic Variables Cheat Sheet Toolbar */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/60 space-y-2">
                  <div className="flex items-center justify-between text-2xs font-bold text-slate-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Available Template Variables
                    </span>
                    <span className="text-slate-400 font-normal">Click placeholder to copy</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(PLACEHOLDERS_BY_KEY[selectedKey] || []).map((ph) => (
                      <button
                        key={ph.code}
                        type="button"
                        onClick={() => copyPlaceholder(ph.code)}
                        className="px-2.5 py-1 text-2xs font-mono font-semibold rounded-lg bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 flex items-center gap-1 transition-colors"
                      >
                        <Copy className="w-3 h-3" /> {ph.code} <span className="text-slate-400 font-sans text-2xs font-normal">({ph.label})</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Editor vs Preview Mode Tabs */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-zinc-800 pt-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveTab('preview')}
                      className={`px-4 py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
                        activeTab === 'preview'
                          ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                          : 'border-transparent text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <Eye className="w-4 h-4" /> Live Rendered Preview
                    </button>
                    <button
                      onClick={() => setActiveTab('code')}
                      className={`px-4 py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
                        activeTab === 'code'
                          ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                          : 'border-transparent text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <Code className="w-4 h-4" /> Edit HTML Code
                    </button>
                  </div>
                </div>

                {/* Tab Content 1: Live Rendered Preview */}
                {activeTab === 'preview' && (
                  <div className="rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden bg-slate-100 dark:bg-zinc-950 p-4">
                    <div className="mb-2 text-2xs text-slate-400 flex items-center justify-between font-mono">
                      <span>Simulated Recipient Inbox Preview</span>
                      <span>Sample Data Rendered</span>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden max-w-2xl mx-auto my-2">
                      <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs font-mono text-slate-600">
                        <span className="font-bold text-slate-900">Subject: </span>
                        {renderSampleHtml(subject)}
                      </div>

                      <div
                        className="p-2 text-slate-800"
                        dangerouslySetInnerHTML={{ __html: renderedPreview }}
                      />
                    </div>
                  </div>
                )}

                {/* Tab Content 2: HTML Source Editor */}
                {activeTab === 'code' && (
                  <div>
                    <textarea
                      rows={18}
                      value={htmlContent}
                      onChange={(e) => setHtmlContent(e.target.value)}
                      className="w-full p-4 text-xs font-mono rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Test Email Modal */}
      <Modal
        isOpen={testModalOpen}
        onClose={() => setTestModalOpen(false)}
        title={`Send Test Email — ${activeTemplate?.name || ''}`}
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setTestModalOpen(false)}>Cancel</button>
            <button
              disabled={!testRecipient || testSendMutation.isPending}
              onClick={() => testSendMutation.mutate(testRecipient)}
              className="btn-primary flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              {testSendMutation.isPending ? 'Sending…' : 'Send Test'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Enter an email address to receive a live test copy of template <span className="font-mono font-bold text-indigo-600">{selectedKey}</span> with sample data.
          </p>

          <div>
            <label className="block text-2xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Recipient Email Address *
            </label>
            <input
              type="email"
              required
              className="input text-xs"
              placeholder="e.g. admin@store.com or your.email@example.com"
              value={testRecipient}
              onChange={(e) => setTestRecipient(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
