import { useState } from 'react';
import { Search, Download, Loader2 } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { useGetAllCustomersQuery, useGetCustomerStatementQuery } from './salesApi';
import { useLanguage } from '../../context/LanguageContext';

const typeColors: Record<string, string> = {
  sale:    'bg-blue-100 text-blue-700',
  payment: 'bg-green-100 text-green-700',
  return:  'bg-orange-100 text-orange-600',
};

const CustomerLedger = () => {
  const { t } = useLanguage();
  const [customerId, setCustomerId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');

  const { data: customersData } = useGetAllCustomersQuery({ limit: 200 });
  const customers: any[] = customersData?.data ?? [];

  const { data: stmtData, isLoading, isFetching } = useGetCustomerStatementQuery(
    { customerId, dateFrom: dateFrom || undefined, dateTo: dateTo || undefined },
    { skip: !customerId },
  );

  const statement = stmtData;

  const entries: any[] = statement?.entries ?? [];
  const currentBalance = statement?.customer?.currentBalance ?? 0;
  const selectedCustomer = customers.find((c: any) => c.id === customerId);

  const filtered = entries.filter(
    (e: any) =>
      (e.reference ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (e.note ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const tableHeaders = [
    t('common.date'),
    t('common.reference'),
    t('common.type'),
    t('sales.customerLedger.debitReceivable'),
    t('sales.customerLedger.creditReceived'),
    t('common.balance'),
    t('common.note'),
  ];

  return (
    <div>
      <PageHeader
        title={t('sales.customerLedger.title')}
        subtitle={t('sales.customerLedger.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: t('nav.sales'), path: '/admin/sales/list' },
          { label: t('sales.customerLedger.title') },
        ]}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
            <Download className="h-4 w-4" /> {t('common.export')}
          </button>
        }
      />

      <div className="bg-white border border-[#DBDFE9] rounded-lg p-5 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('sales.customerLedger.selectCustomer')}</label>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]">
              <option value="">{t('sales.customerLedger.selectCustomerOption')}</option>
              {customers.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('common.fromDate')}</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('common.toDate')}</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          </div>
        </div>
        {customerId && selectedCustomer && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-[#26272F]">{selectedCustomer.name}</span>
            {selectedCustomer.mobile && <span className="text-xs text-gray-400">{selectedCustomer.mobile}</span>}
            <span className="text-xs text-gray-500">{t('sales.customerLedger.currentBalance')}</span>
            <span className={`text-sm font-bold ${Number(currentBalance) > 0 ? 'text-orange-500' : 'text-green-600'}`}>
              ৳{Number(currentBalance).toLocaleString()}
              <span className="ml-1 font-normal text-xs">
                ({Number(currentBalance) > 0 ? t('sales.customerLedger.due') : t('sales.customerLedger.clear')})
              </span>
            </span>
          </div>
        )}
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9]">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder={t('sales.customerLedger.searchPlaceholder')} value={search}
              onChange={(e) => setSearch(e.target.value)}
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
              {!customerId ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-gray-400">
                    <Search className="h-8 w-8 mx-auto mb-2 text-gray-200" />
                    <p>{t('sales.customerLedger.selectPrompt')}</p>
                  </td>
                </tr>
              ) : isLoading || isFetching ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-[#ff6d29]" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">{t('sales.customerLedger.noTransactions')}</td></tr>
              ) : (
                filtered.map((entry: any, idx: number) => (
                  <tr key={entry.id ?? idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{new Date(entry.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-mono text-xs text-[#ff6d29]">{entry.reference}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${typeColors[entry.type] ?? 'bg-gray-100 text-gray-600'}`}>
                        {entry.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-orange-500">{Number(entry.debit) > 0 ? `৳${Number(entry.debit).toLocaleString()}` : '—'}</td>
                    <td className="px-4 py-3 font-medium text-green-600">{Number(entry.credit) > 0 ? `৳${Number(entry.credit).toLocaleString()}` : '—'}</td>
                    <td className="px-4 py-3 font-bold text-[#26272F]">৳{Number(entry.balance).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-500">{entry.note ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerLedger;
