import { useState } from 'react';
import { Search, Download, Clock, CheckCircle, XCircle } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { useLanguage } from '../../context/LanguageContext';

const attendanceData = [
  { id: 1, employee: 'Ahmed Raza', code: 'EMP-001', date: '2025-05-26', check_in: '09:02', check_out: '18:05', hours: '9h 03m', status: 'present' },
  { id: 2, employee: 'Nusrat Jahan', code: 'EMP-002', date: '2025-05-26', check_in: '09:15', check_out: '17:55', hours: '8h 40m', status: 'present' },
  { id: 3, employee: 'Kamal Hossain', code: 'EMP-003', date: '2025-05-26', check_in: '10:30', check_out: '18:00', hours: '7h 30m', status: 'late' },
  { id: 4, employee: 'Rina Akter', code: 'EMP-004', date: '2025-05-26', check_in: '—', check_out: '—', hours: '—', status: 'absent' },
];

const statusColors = {
  present: 'bg-green-100 text-green-700',
  late: 'bg-yellow-100 text-yellow-700',
  absent: 'bg-red-100 text-red-500',
  leave: 'bg-blue-100 text-blue-700',
};

const Attendance = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('2025-05-26');
  const filtered = attendanceData.filter((a) => a.employee.toLowerCase().includes(search.toLowerCase()) || a.code.includes(search));

  const summaryCards = [
    { labelKey: 'hrm.attendance.present', value: attendanceData.filter((a) => a.status === 'present').length, icon: <CheckCircle className="h-5 w-5" />, cls: 'text-green-700 bg-green-50 border-green-200' },
    { labelKey: 'hrm.attendance.late', value: attendanceData.filter((a) => a.status === 'late').length, icon: <Clock className="h-5 w-5" />, cls: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
    { labelKey: 'hrm.attendance.absent', value: attendanceData.filter((a) => a.status === 'absent').length, icon: <XCircle className="h-5 w-5" />, cls: 'text-red-600 bg-red-50 border-red-200' },
    { labelKey: 'common.total', value: attendanceData.length, icon: <Clock className="h-5 w-5" />, cls: 'text-blue-700 bg-blue-50 border-blue-200' },
  ] as const;

  const tableHeaders = [
    t('hrm.attendance.colCode'),
    t('hrm.attendance.colEmployee'),
    t('common.date'),
    t('hrm.attendance.colCheckIn'),
    t('hrm.attendance.colCheckOut'),
    t('hrm.attendance.colHours'),
    t('common.status'),
  ];

  return (
    <div>
      <PageHeader
        title={t('hrm.attendance.title')}
        subtitle={t('hrm.attendance.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: t('nav.hrm'), path: '/admin/hrm/employees' },
          { label: t('hrm.attendance.title') },
        ]}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
            <Download className="h-4 w-4" /> {t('common.export')}
          </button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {summaryCards.map((s) => (
          <div key={s.labelKey} className={`border rounded-lg p-4 flex items-center gap-3 ${s.cls}`}>
            {s.icon}
            <div>
              <p className="text-xs font-medium opacity-70">{t(s.labelKey)}</p>
              <p className="text-xl font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9] flex flex-col sm:flex-row gap-3">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder={t('hrm.attendance.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)}
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
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.code}</td>
                  <td className="px-4 py-3 font-medium text-[#26272F]">{item.employee}</td>
                  <td className="px-4 py-3 text-gray-600">{item.date}</td>
                  <td className="px-4 py-3 text-green-600 font-medium">{item.check_in}</td>
                  <td className="px-4 py-3 text-red-500 font-medium">{item.check_out}</td>
                  <td className="px-4 py-3 text-gray-600">{item.hours}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[item.status as keyof typeof statusColors]}`}>{item.status}</span>
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

export default Attendance;
