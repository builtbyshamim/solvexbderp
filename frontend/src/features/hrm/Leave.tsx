import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

const leaveRequests = [
  { id: 1, employee: 'Ahmed Raza', code: 'EMP-001', type: 'Sick Leave', from: '2025-05-28', to: '2025-05-29', days: 2, reason: 'Medical treatment', status: 'pending' },
  { id: 2, employee: 'Nusrat Jahan', code: 'EMP-002', type: 'Annual Leave', from: '2025-06-01', to: '2025-06-03', days: 3, reason: 'Personal', status: 'approved' },
  { id: 3, employee: 'Kamal Hossain', code: 'EMP-003', type: 'Emergency Leave', from: '2025-05-27', to: '2025-05-27', days: 1, reason: 'Family emergency', status: 'approved' },
];

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-500',
};

const Leave = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [requests, setRequests] = useState(leaveRequests);
  const filtered = requests.filter((r) => r.employee.toLowerCase().includes(search.toLowerCase()));

  const updateStatus = (id: number, status: string) => {
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
    toast.success(`Leave ${status}`);
  };

  const summaryCards = [
    { labelKey: 'hrm.leave.pending', value: requests.filter((r) => r.status === 'pending').length, cls: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
    { labelKey: 'hrm.leave.approved', value: requests.filter((r) => r.status === 'approved').length, cls: 'bg-green-50 border-green-200 text-green-700' },
    { labelKey: 'hrm.leave.rejected', value: requests.filter((r) => r.status === 'rejected').length, cls: 'bg-red-50 border-red-200 text-red-600' },
  ] as const;

  const tableHeaders = [
    t('hrm.attendance.colEmployee'),
    t('hrm.leave.colLeaveType'),
    t('hrm.leave.colFrom'),
    t('hrm.leave.colTo'),
    t('hrm.leave.colDays'),
    t('hrm.leave.colReason'),
    t('common.status'),
    t('common.action'),
  ];

  return (
    <div>
      <PageHeader
        title={t('hrm.leave.title')}
        subtitle={t('hrm.leave.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: t('nav.hrm'), path: '/admin/hrm/employees' },
          { label: t('hrm.leave.title') },
        ]}
        actions={
          <button onClick={() => toast.success('Leave request form coming soon')} className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">
            <Plus className="h-4 w-4" /> {t('hrm.leave.newRequest')}
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {summaryCards.map((s) => (
          <div key={s.labelKey} className={`border rounded-lg p-4 ${s.cls}`}>
            <p className="text-xs font-medium opacity-70">{t(s.labelKey)}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9]">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder={t('hrm.leave.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {tableHeaders.map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3"><div className="font-medium text-[#26272F]">{item.employee}</div><div className="text-xs text-gray-400">{item.code}</div></td>
                  <td className="px-4 py-3 text-gray-600">{item.type}</td>
                  <td className="px-4 py-3 text-gray-600">{item.from}</td>
                  <td className="px-4 py-3 text-gray-600">{item.to}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{item.days}d</span></td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{item.reason}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[item.status as keyof typeof statusColors]}`}>{item.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    {item.status === 'pending' && (
                      <div className="flex gap-1.5">
                        <button onClick={() => updateStatus(item.id, 'approved')} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200">
                          {t('hrm.leave.approve')}
                        </button>
                        <button onClick={() => updateStatus(item.id, 'rejected')} className="px-2 py-1 bg-red-100 text-red-500 rounded text-xs hover:bg-red-200">
                          {t('hrm.leave.reject')}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leave;
