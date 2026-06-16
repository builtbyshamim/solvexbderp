import { useState } from 'react';
import { Download, Loader2, RefreshCw } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { useGetCashFlowQuery } from './accountingApi';
import { useLanguage } from '../../context/LanguageContext';

const CashFlow = () => {
  const { t } = useLanguage();
  const now = new Date();
  const [dateFrom, setDateFrom] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0],
  );
  const [dateTo, setDateTo] = useState(now.toISOString().split('T')[0]);

  const { data, isLoading, refetch } = useGetCashFlowQuery(
    { dateFrom, dateTo },
    { skip: !dateFrom || !dateTo },
  );

  const d = data ?? {
    operating: [],
    operatingTotal: 0,
    openingBalance: 0,
    closingBalance: 0,
    netCashFlow: 0,
  };

  const Section = ({
    title,
    items,
    total,
    colorClass,
  }: {
    title: string;
    items: { label: string; amount: number }[];
    total: number;
    colorClass: string;
  }) => (
    <div className="bg-white border border-[#DBDFE9] rounded-lg overflow-hidden">
      <div className={`px-5 py-4 border-b border-[#DBDFE9] ${colorClass}`}>
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>
      <div className="p-5 space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex justify-between text-sm">
            <span className="text-gray-600">{item.label}</span>
            <span className={`font-medium ${item.amount >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {item.amount >= 0 ? '+' : ''}৳{Number(item.amount).toLocaleString()}
            </span>
          </div>
        ))}
        <div className="border-t border-[#DBDFE9] pt-2 flex justify-between font-bold">
          <span>{t('accounting.cashFlow.netCashFlow')}</span>
          <span className={total >= 0 ? 'text-green-600' : 'text-red-500'}>
            {total >= 0 ? '+' : ''}৳{Number(total).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <PageHeader
        title={t('accounting.cashFlow.title')}
        subtitle={t('accounting.cashFlow.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: t('nav.accounting'), path: '/admin/accounting/accounts' },
          { label: t('accounting.cashFlow.breadcrumb') },
        ]}
        actions={
          <div className="flex gap-2 flex-wrap">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none"
            />
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-3 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
              <Download className="h-4 w-4" /> {t('common.export')}
            </button>
          </div>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-[#ff6d29]" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 border border-[#DBDFE9] rounded-lg p-5">
              <p className="text-xs text-gray-500">{t('accounting.cashFlow.openingBalance')}</p>
              <p className="text-2xl font-bold text-[#26272F] mt-1">
                ৳{Number(d.openingBalance).toLocaleString()}
              </p>
            </div>
            <div className={`border rounded-lg p-5 ${d.netCashFlow >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <p className={`text-xs ${d.netCashFlow >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {t('accounting.cashFlow.netChangeInCash')}
              </p>
              <p className={`text-2xl font-bold mt-1 ${d.netCashFlow >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                {d.netCashFlow >= 0 ? '+' : ''}৳{Number(d.netCashFlow).toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
              <p className="text-xs text-blue-600">{t('accounting.cashFlow.closingBalance')}</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">
                ৳{Number(d.closingBalance).toLocaleString()}
              </p>
            </div>
          </div>

          <Section
            title={t('accounting.cashFlow.operatingActivities')}
            items={d.operating}
            total={d.operatingTotal}
            colorClass="bg-blue-50 text-blue-700"
          />
        </>
      )}
    </div>
  );
};

export default CashFlow;
