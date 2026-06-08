import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Download, Loader2 } from 'lucide-react';
import PageHeader from '../../components/shared/PageHeader';
import { useGetAllAccountsQuery, useGetAccountLedgerQuery } from './accountingApi';
import { useLanguage } from '../../context/LanguageContext';

const typeColors: Record<string, string> = {
  opening:          'bg-gray-100 text-gray-600',
  income:           'bg-green-100 text-green-700',
  expense:          'bg-red-100 text-red-500',
  sale_payment:     'bg-blue-100 text-blue-700',
  purchase_payment: 'bg-orange-100 text-orange-600',
  transfer_in:      'bg-teal-100 text-teal-700',
  transfer_out:     'bg-gray-200 text-gray-600',
  adjustment:       'bg-yellow-100 text-yellow-700',
};

const AccountLedger = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [accountId, setAccountId] = useState(searchParams.get('accountId') ?? '');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data = [] } = useGetAllAccountsQuery({});
  const accountsData = data || [];
  const cashAccounts = accountsData?.filter((a: any) =>
    ['cash', 'bank', 'mobile_banking'].includes(a.accountType),
  );

  const { data: ledgerRes, isLoading } = useGetAccountLedgerQuery({
    accountId: accountId || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
    limit: 25,
  });
  const entries = ledgerRes?.data ?? [];
  const meta = ledgerRes?.meta;

  const selectedAccount = cashAccounts.find((a: any) => a.id === accountId);

  const tableHeaders = [
    t('common.date'),
    t('accounting.ledger.accountLabel'),
    t('common.type'),
    t('common.category'),
    t('common.debitIn'),
    t('common.creditOut'),
    t('accounting.ledger.balanceAfter'),
    t('common.note'),
  ];

  return (
    <div>
      <PageHeader
        title={t('accounting.ledger.title')}
        subtitle={t('accounting.ledger.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: t('nav.accounting'), path: '/admin/accounting/accounts' },
          { label: t('accounting.ledger.title') },
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
            <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('accounting.ledger.selectAccount')}</label>
            <select
              value={accountId}
              onChange={(e) => { setAccountId(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
            >
              <option value="">{t('accounting.ledger.allAccounts')}</option>
              {cashAccounts.map((a: any) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('common.fromDate')}</label>
            <input
              type="date" value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('common.toDate')}</label>
            <input
              type="date" value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
            />
          </div>
        </div>
        {selectedAccount && (
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <div>
              <span className="text-xs text-gray-500">{t('accounting.ledger.accountLabel')}: </span>
              <span className="text-sm font-semibold text-[#26272F]">{selectedAccount.name}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500">{t('accounting.ledger.currentBalance')}: </span>
              <span className="text-sm font-bold text-green-600">
                ৳{Number(selectedAccount.currentBalance).toLocaleString()}
              </span>
            </div>
            {selectedAccount.bankName && (
              <div>
                <span className="text-xs text-gray-500">{t('accounting.ledger.bankLabel')}: </span>
                <span className="text-sm text-gray-600">{selectedAccount.bankName}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9]">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('accounting.ledger.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
            />
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
              {isLoading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-[#ff6d29]" /></td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">{t('accounting.ledger.noEntries')}</td></tr>
              ) : (
                entries
                  .filter((e: any) =>
                    !search ||
                    e.note?.toLowerCase().includes(search.toLowerCase()) ||
                    e.category?.toLowerCase().includes(search.toLowerCase()),
                  )
                  .map((entry: any) => (
                    <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{new Date(entry.transactionDate).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs">{entry.account?.name ?? '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${typeColors[entry.transactionType] ?? 'bg-gray-100 text-gray-600'}`}>
                          {entry.transactionType?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{entry.category || '—'}</td>
                      <td className="px-4 py-3 text-green-600 font-medium">
                        {Number(entry.debit) > 0 ? `৳${Number(entry.debit).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-red-500 font-medium">
                        {Number(entry.credit) > 0 ? `৳${Number(entry.credit).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-4 py-3 font-bold text-[#26272F]">৳{Number(entry.balanceAfter).toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate">{entry.note || '—'}</td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="p-4 border-t border-[#DBDFE9] flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {meta.totalItems} {t('common.entries')} — {t('common.page')} {meta.currentPage} {t('common.of')} {meta.totalPages}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border border-[#DBDFE9] rounded text-xs disabled:opacity-40 hover:bg-gray-50">{t('common.prev')}</button>
              <button onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages} className="px-3 py-1 border border-[#DBDFE9] rounded text-xs disabled:opacity-40 hover:bg-gray-50">{t('common.next')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountLedger;
