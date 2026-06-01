import { useState } from 'react';
import { Search, Eye, CheckCircle } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

const payrollData = [
  { id: 1, employee: 'Ahmed Raza', code: 'EMP-001', month: 'May 2025', basic: 25000, allowances: 5000, deductions: 2500, net: 27500, status: 'pending' },
  { id: 2, employee: 'Nusrat Jahan', code: 'EMP-002', month: 'May 2025', basic: 22000, allowances: 4000, deductions: 0, net: 26000, status: 'pending' },
  { id: 3, employee: 'Kamal Hossain', code: 'EMP-003', month: 'May 2025', basic: 18000, allowances: 3000, deductions: 1000, net: 20000, status: 'paid' },
  { id: 4, employee: 'Rina Akter', code: 'EMP-004', month: 'May 2025', basic: 35000, allowances: 8000, deductions: 0, net: 43000, status: 'pending' },
];

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  hold: 'bg-red-100 text-red-500',
};

const Payroll = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [records, setRecords] = useState(payrollData);
  const filtered = records.filter((r) => r.employee.toLowerCase().includes(search.toLowerCase()));

  const totalPayroll = records.reduce((s, r) => s + r.net, 0);
  const paidAmount = records.filter((r) => r.status === 'paid').reduce((s, r) => s + r.net, 0);

  const tableHeaders = [
    t('hrm.attendance.colEmployee'),
    t('hrm.payroll.colMonth'),
    t('hrm.payroll.colBasic'),
    t('hrm.payroll.colAllowances'),
    t('hrm.payroll.colDeductions'),
    t('hrm.payroll.colNetSalary'),
    t('common.status'),
    t('common.action'),
  ];

  return (
    <div>
      <PageHeader
        title={t('hrm.payroll.title')}
        subtitle={t('hrm.payroll.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: t('nav.hrm'), path: '/admin/hrm/employees' },
          { label: t('hrm.payroll.title') },
        ]}
        actions={
          <button onClick={() => toast.success('Payroll generation coming soon')} className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">
            <CheckCircle className="h-4 w-4" /> {t('hrm.payroll.generatePayroll')}
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-[#DBDFE9] rounded-lg p-4">
          <p className="text-xs text-gray-500">{t('hrm.payroll.totalPayroll')}</p>
          <p className="text-2xl font-bold mt-1">৳{totalPayroll.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-[#DBDFE9] rounded-lg p-4">
          <p className="text-xs text-gray-500">{t('hrm.payroll.paid')}</p>
          <p className="text-2xl font-bold text-green-600 mt-1">৳{paidAmount.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-[#DBDFE9] rounded-lg p-4">
          <p className="text-xs text-gray-500">{t('hrm.payroll.pending')}</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">৳{(totalPayroll - paidAmount).toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9]">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder={t('hrm.payroll.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)}
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
                  <td className="px-4 py-3 text-gray-600">{item.month}</td>
                  <td className="px-4 py-3">৳{item.basic.toLocaleString()}</td>
                  <td className="px-4 py-3 text-green-600">+৳{item.allowances.toLocaleString()}</td>
                  <td className="px-4 py-3 text-red-500">-৳{item.deductions.toLocaleString()}</td>
                  <td className="px-4 py-3 font-bold text-[#26272F]">৳{item.net.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[item.status as keyof typeof statusColors]}`}>{item.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"><Eye className="h-4 w-4" /></button>
                      {item.status === 'pending' && (
                        <button onClick={() => { setRecords((prev) => prev.map((r) => r.id === item.id ? { ...r, status: 'paid' } : r)); toast.success('Marked as paid'); }}
                          className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200">
                          {t('hrm.payroll.pay')}
                        </button>
                      )}
                    </div>
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

export default Payroll;
