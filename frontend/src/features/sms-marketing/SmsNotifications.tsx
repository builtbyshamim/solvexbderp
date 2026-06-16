import { useEffect, useState, useCallback } from 'react';
import {
  Bell, Eye, RotateCcw, Save, ChevronDown, ChevronUp,
  ShoppingCart, CreditCard, PackageX, Info, CheckCircle2,
} from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import {
  useGetTransactionalSmsSettingsQuery,
  useSaveTransactionalSmsSettingsMutation,
  usePreviewTransactionalSmsMutation,
} from './smsMarketingApi';
import toast from 'react-hot-toast';

// ── Types ─────────────────────────────────────────────────────────────────────

interface EventSetting {
  event: string;
  label: string;
  isEnabled: boolean;
  template: string;
  defaultTemplate: string;
  variables: string[];
}

interface LocalSetting extends EventSetting {
  expanded: boolean;
  previewText: string;
  previewCharCount: number;
  previewSmsCount: number;
  isDirty: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const EVENT_ICONS: Record<string, React.ReactNode> = {
  sale_created: <ShoppingCart className="w-5 h-5" />,
  payment_received: <CreditCard className="w-5 h-5" />,
  sale_return: <PackageX className="w-5 h-5" />,
};

const EVENT_COLORS: Record<string, string> = {
  sale_created: 'blue',
  payment_received: 'green',
  sale_return: 'orange',
};

const VARIABLE_LABELS: Record<string, string> = {
  customer_name: 'Customer Name',
  invoice_no: 'Invoice No',
  invoice_link: 'Invoice Link',
  total_amount: 'Total Amount',
  paid_amount: 'Paid Amount',
  due_amount: 'Due Amount',
  payment_amount: 'Payment Amount',
  return_amount: 'Return Amount',
  sale_date: 'Sale Date',
  business_name: 'Business Name',
};

const CHAR_LIMIT_SINGLE = 160;

// ── Helper: character counter bar ─────────────────────────────────────────────

const CharBar = ({ count }: { count: number }) => {
  const over = count > CHAR_LIMIT_SINGLE;
  const pct = Math.min((count / CHAR_LIMIT_SINGLE) * 100, 100);
  const smsCount = Math.ceil(count / CHAR_LIMIT_SINGLE);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className={over ? 'text-red-600 font-medium' : 'text-gray-500'}>
          {count} characters
        </span>
        <span className={smsCount > 1 ? 'text-orange-600 font-medium' : 'text-gray-500'}>
          {smsCount} SMS credit{smsCount > 1 ? 's' : ''}
        </span>
      </div>
      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : pct > 80 ? 'bg-orange-400' : 'bg-blue-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────

const SmsNotifications = () => {
  const { data: serverSettings, isLoading } = useGetTransactionalSmsSettingsQuery(undefined);
  const [saveSettings, { isLoading: isSaving }] = useSaveTransactionalSmsSettingsMutation();
  const [previewSms] = usePreviewTransactionalSmsMutation();

  const [settings, setSettings] = useState<LocalSetting[]>([]);
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);

  useEffect(() => {
    if (serverSettings) {
      setSettings(
        serverSettings.map((s: EventSetting) => ({
          ...s,
          expanded: false,
          previewText: '',
          previewCharCount: s.template.length,
          previewSmsCount: Math.ceil(s.template.length / CHAR_LIMIT_SINGLE),
          isDirty: false,
        }))
      );
    }
  }, [serverSettings]);

  const update = useCallback((event: string, patch: Partial<LocalSetting>) => {
    setSettings((prev) =>
      prev.map((s) => (s.event === event ? { ...s, ...patch, isDirty: true } : s))
    );
  }, []);

  const insertVariable = (event: string, variable: string, template: string) => {
    const tag = `{{${variable}}}`;
    const newTpl = template + tag;
    update(event, {
      template: newTpl,
      previewCharCount: newTpl.length,
      previewSmsCount: Math.ceil(newTpl.length / CHAR_LIMIT_SINGLE),
    });
  };

  const handleTemplateChange = (event: string, value: string) => {
    update(event, {
      template: value,
      previewCharCount: value.length,
      previewSmsCount: Math.ceil(value.length / CHAR_LIMIT_SINGLE),
      previewText: '',
    });
  };

  const handlePreview = async (setting: LocalSetting) => {
    setPreviewLoading(setting.event);
    try {
      const res = await previewSms({ template: setting.template }).unwrap();
      update(setting.event, {
        previewText: res.rendered,
        previewCharCount: res.charCount,
        previewSmsCount: res.smsCount,
      });
    } catch {
      toast.error('Preview failed');
    } finally {
      setPreviewLoading(null);
    }
  };

  const handleRestoreDefault = (event: string, defaultTemplate: string) => {
    update(event, {
      template: defaultTemplate,
      previewText: '',
      previewCharCount: defaultTemplate.length,
      previewSmsCount: Math.ceil(defaultTemplate.length / CHAR_LIMIT_SINGLE),
    });
  };

  const handleSave = async () => {
    try {
      await saveSettings({
        settings: settings.map(({ event, isEnabled, template }) => ({ event, isEnabled, template })),
      }).unwrap();
      setSettings((prev) => prev.map((s) => ({ ...s, isDirty: false })));
      toast.success('SMS notification settings saved');
    } catch {
      toast.error('Failed to save settings');
    }
  };

  const anyDirty = settings.some((s) => s.isDirty);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="SMS Notifications"
        subtitle="Auto-send SMS to customers on key events. Customize templates with dynamic variables."
        icon={<Bell className="w-6 h-6" />}
      />

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 space-y-1">
          <p className="font-medium">How it works</p>
          <p>
            When a sale is created or payment is collected, the customer will automatically receive an SMS
            (if they have a phone number). Requires SMS gateway to be configured in{' '}
            <span className="font-medium">SMS Configuration</span>.
          </p>
        </div>
      </div>

      {/* Event cards */}
      <div className="space-y-4">
        {settings.map((setting) => {
          const color = EVENT_COLORS[setting.event] ?? 'gray';
          const isExpanded = setting.expanded;

          return (
            <div
              key={setting.event}
              className={`bg-white rounded-xl border transition-all ${
                setting.isDirty ? 'border-orange-300 shadow-sm' : 'border-gray-200'
              }`}
            >
              {/* Card header */}
              <div className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg bg-${color}-100 text-${color}-600 flex-shrink-0`}>
                      {EVENT_ICONS[setting.event]}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{setting.label}</h3>
                        {setting.isDirty && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                            Unsaved
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5 truncate">
                        {setting.isEnabled ? 'Active — SMS will be sent automatically' : 'Disabled — no SMS will be sent'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Toggle */}
                    <button
                      onClick={() => update(setting.event, { isEnabled: !setting.isEnabled })}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                        setting.isEnabled ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                      aria-label="Toggle"
                    >
                      <span
                        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                          setting.isEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>

                    {/* Expand */}
                    <button
                      onClick={() => update(setting.event, { expanded: !isExpanded })}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded editor */}
              {isExpanded && (
                <div className="border-t border-gray-100 p-4 sm:p-5 space-y-4">
                  {/* Variable chips */}
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">
                      Click a variable to insert it into the template:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {setting.variables.map((v) => (
                        <button
                          key={v}
                          onClick={() => insertVariable(setting.event, v, setting.template)}
                          className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors font-mono"
                        >
                          {'{{' + v + '}}'}
                          <span className="ml-1 text-blue-400 font-sans not-italic">
                            {VARIABLE_LABELS[v] ? `— ${VARIABLE_LABELS[v]}` : ''}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Template textarea */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-700">Message Template</label>
                    <textarea
                      value={setting.template}
                      onChange={(e) => handleTemplateChange(setting.event, e.target.value)}
                      rows={4}
                      className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Write your SMS template here..."
                    />
                    <CharBar count={setting.previewCharCount} />
                  </div>

                  {/* Preview output */}
                  {setting.previewText && (
                    <div className="bg-gray-900 rounded-xl p-4">
                      <p className="text-xs text-gray-400 mb-2 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                        Preview with sample data
                      </p>
                      <p className="text-sm text-white font-mono leading-relaxed whitespace-pre-wrap">
                        {setting.previewText}
                      </p>
                    </div>
                  )}

                  {/* Action row */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      onClick={() => handlePreview(setting)}
                      disabled={previewLoading === setting.event}
                      className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <Eye className="w-4 h-4" />
                      {previewLoading === setting.event ? 'Loading...' : 'Preview'}
                    </button>
                    <button
                      onClick={() => handleRestoreDefault(setting.event, setting.defaultTemplate)}
                      className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restore Default
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Save button — sticky on mobile */}
      <div className="sticky bottom-4">
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving || !anyDirty}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white font-medium shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving...' : anyDirty ? 'Save Changes' : 'All Saved'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmsNotifications;
