import { Download, Loader2, RefreshCw } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { useGetBalanceSheetQuery } from './accountingApi';
import { useLanguage } from '../../context/LanguageContext';

const BalanceSheet = () => {
  const { t } = useLanguage();
  const { data, isLoading, refetch } = useGetBalanceSheetQuery(undefined);

  const d = data ?? {
    assets: { current: [], totalCurrent: 0, totalAssets: 0 },
    liabilities: { current: [], totalCurrent: 0, totalLiabilities: 0 },
    equity: { amount: 0 },
    totalCheck: 0,
  };

  return (
    <div>
      <PageHeader
        title={t('accounting.balanceSheet.title')}
        subtitle={t('accounting.balanceSheet.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: t('nav.accounting'), path: '/admin/accounting/accounts' },
          { label: t('accounting.balanceSheet.title') },
        ]}
        actions={
          <div className="flex gap-2">
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
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-xs text-blue-600">{t('accounting.balanceSheet.totalAssets')}</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">
                ৳{Number(d.assets.totalAssets).toLocaleString()}
              </p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-xs text-red-500">{t('accounting.balanceSheet.totalLiabilities')}</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                ৳{Number(d.liabilities.totalLiabilities).toLocaleString()}
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-xs text-green-600">{t('accounting.balanceSheet.ownersEquity')}</p>
              <p className="text-2xl font-bold text-green-700 mt-1">
                ৳{Number(d.equity.amount).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white border border-[#DBDFE9] rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-[#DBDFE9] bg-blue-50">
                <h3 className="font-semibold text-blue-700 text-sm">{t('accounting.balanceSheet.assets')}</h3>
              </div>
              <div className="p-5 space-y-5">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    {t('accounting.balanceSheet.currentAssets')}
                  </h4>
                  <div className="space-y-2">
                    {d.assets.current.map((a: any) => (
                      <div key={a.name} className="flex justify-between text-sm">
                        <span className="text-gray-600">{a.name}</span>
                        <span className="font-medium">৳{Number(a.amount).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex justify-between font-semibold text-sm">
                      <span>{t('accounting.balanceSheet.totalCurrentAssets')}</span>
                      <span>৳{Number(d.assets.totalCurrent).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="border-t-2 border-blue-600 pt-2 flex justify-between font-bold text-base">
                  <span>{t('accounting.balanceSheet.totalAssets')}</span>
                  <span className="text-blue-600">৳{Number(d.assets.totalAssets).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#DBDFE9] rounded-lg overflow-hidden">
              <div className="px-5 py-4 border-b border-[#DBDFE9] bg-red-50">
                <h3 className="font-semibold text-red-600 text-sm">{t('accounting.balanceSheet.liabilitiesEquity')}</h3>
              </div>
              <div className="p-5 space-y-5">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    {t('accounting.balanceSheet.currentLiabilities')}
                  </h4>
                  <div className="space-y-2">
                    {d.liabilities.current.map((l: any) => (
                      <div key={l.name} className="flex justify-between text-sm">
                        <span className="text-gray-600">{l.name}</span>
                        <span className="font-medium">৳{Number(l.amount).toLocaleString()}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex justify-between font-semibold text-sm">
                      <span>{t('accounting.balanceSheet.totalLiabilitiesLabel')}</span>
                      <span className="text-red-600">৳{Number(d.liabilities.totalLiabilities).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                  <div className="flex justify-between font-bold text-base">
                    <span className="text-green-700">{t('accounting.balanceSheet.ownersEquity')}</span>
                    <span className="text-green-700">৳{Number(d.equity.amount).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{t('accounting.balanceSheet.assetsMinusLiabilities')}</p>
                </div>
                <div className="border-t-2 border-[#26272F] pt-2 flex justify-between font-bold text-base">
                  <span>{t('accounting.balanceSheet.totalLEquity')}</span>
                  <span>৳{Number(d.assets.totalAssets).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BalanceSheet;
