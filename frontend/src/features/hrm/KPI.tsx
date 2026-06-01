import { useState } from 'react';
import { Plus, Star } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

const kpiData = [
  { id: 1, employee: 'Ahmed Raza', code: 'EMP-001', period: 'Q1 2025', sales_target: 500000, sales_actual: 485000, attendance: 95, quality: 4.2, overall: 4.0, status: 'evaluated' },
  { id: 2, employee: 'Nusrat Jahan', code: 'EMP-002', period: 'Q1 2025', sales_target: 0, sales_actual: 0, attendance: 98, quality: 4.8, overall: 4.8, status: 'evaluated' },
  { id: 3, employee: 'Kamal Hossain', code: 'EMP-003', period: 'Q1 2025', sales_target: 0, sales_actual: 0, attendance: 88, quality: 3.5, overall: 3.7, status: 'pending' },
];

const RatingStars = ({ value }: { value: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star key={star} className={`h-3.5 w-3.5 ${star <= Math.round(value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
    ))}
    <span className="ml-1 text-xs text-gray-600">{value.toFixed(1)}</span>
  </div>
);

const KPI = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const filtered = kpiData.filter((k) => k.employee.toLowerCase().includes(search.toLowerCase()));

  const tableHeaders = [
    t('hrm.attendance.colEmployee'),
    t('hrm.kpi.colPeriod'),
    t('hrm.kpi.colAttendance'),
    t('hrm.kpi.colSalesAchievement'),
    t('hrm.kpi.colQualityRating'),
    t('hrm.kpi.colOverallScore'),
    t('common.status'),
  ];

  return (
    <div>
      <PageHeader
        title={t('hrm.kpi.title')}
        subtitle={t('hrm.kpi.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: t('nav.hrm'), path: '/admin/hrm/employees' },
          { label: t('hrm.kpi.title') },
        ]}
        actions={
          <button onClick={() => toast.success('KPI evaluation form coming soon')} className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">
            <Plus className="h-4 w-4" /> {t('hrm.kpi.newEvaluation')}
          </button>
        }
      />

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
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
                  <td className="px-4 py-3 text-gray-600">{item.period}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 w-16">
                        <div className={`h-1.5 rounded-full ${item.attendance >= 90 ? 'bg-green-500' : 'bg-yellow-400'}`} style={{ width: `${item.attendance}%` }} />
                      </div>
                      <span className="text-xs font-medium">{item.attendance}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {item.sales_target > 0 ? (
                      <span className={`font-medium ${(item.sales_actual / item.sales_target) >= 0.9 ? 'text-green-600' : 'text-orange-500'}`}>
                        {Math.round((item.sales_actual / item.sales_target) * 100)}%
                      </span>
                    ) : <span className="text-gray-400">N/A</span>}
                  </td>
                  <td className="px-4 py-3"><RatingStars value={item.quality} /></td>
                  <td className="px-4 py-3"><RatingStars value={item.overall} /></td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${item.status === 'evaluated' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{item.status}</span>
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

export default KPI;
