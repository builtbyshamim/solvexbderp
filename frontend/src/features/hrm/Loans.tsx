import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

const loansData = [
  { id: 1, employee: 'Ahmed Raza', code: 'EMP-001', type: 'Loan', amount: 50000, paid: 20000, remaining: 30000, installment: 5000, date: '2025-03-01', status: 'active' },
  { id: 2, employee: 'Kamal Hossain', code: 'EMP-003', type: 'Advance', amount: 10000, paid: 10000, remaining: 0, installment: 5000, date: '2025-04-15', status: 'completed' },
];

const statusColors = {
  active: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-500',
};

const Loans = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const filtered = loansData.filter((l) => l.employee.toLowerCase().includes(search.toLowerCase()));
  const totalLoans = loansData.reduce((s, l) => s + l.amount, 0);
  const totalRemaining = loansData.reduce((s, l) => s + l.remaining, 0);

  const tableHeaders = [
    t('hrm.attendance.colEmployee'),
    t('common.type'),
    t('common.amount'),
    t('common.paid'),
    t('hrm.loans.colRemaining'),
    t('hrm.loans.colInstallment'),
    t('common.date'),
    t('common.status'),
  ];

  return (
    <div>
      <PageHeader
        title={t('hrm.loans.title')}
        subtitle={t('hrm.loans.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: t('nav.hrm'), path: '/admin/hrm/employees' },
          { label: t('hrm.loans.title') },
        ]}
        actions={
          <button onClick={() => toast.success('Loan application form coming soon')} className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">
            <Plus className="h-4 w-4" /> {t('hrm.loans.newLoan')}
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-[#DBDFE9] rounded-lg p-4">
          <p className="text-xs text-gray-500">{t('hrm.loans.totalLoansGiven')}</p>
          <p className="text-2xl font-bold text-[#26272F] mt-1">৳{totalLoans.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-[#DBDFE9] rounded-lg p-4">
          <p className="text-xs text-gray-500">{t('hrm.payroll.paid')}</p>
          <p className="text-2xl font-bold text-green-600 mt-1">৳{(totalLoans - totalRemaining).toLocaleString()}</p>
        </div>
        <div className="bg-white border border-[#DBDFE9] rounded-lg p-4">
          <p className="text-xs text-gray-500">{t('hrm.loans.outstanding')}</p>
          <p className="text-2xl font-bold text-orange-500 mt-1">৳{totalRemaining.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9]">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder={t('hrm.loans.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)}
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
                  <td className="px-4 py-3"><span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">{item.type}</span></td>
                  <td className="px-4 py-3 font-medium">৳{item.amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-green-600">৳{item.paid.toLocaleString()}</td>
                  <td className="px-4 py-3 text-orange-500 font-medium">৳{item.remaining.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-600">৳{item.installment.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{item.date}</td>
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

export default Loans;
