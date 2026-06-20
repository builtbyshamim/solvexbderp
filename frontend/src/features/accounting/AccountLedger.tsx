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

const fmt = (v: any) =>
  Number(v).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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

  const filtered = entries.filter((e: any) =>
    !search ||
    e.note?.toLowerCase().includes(search.toLowerCase()) ||
    e.category?.toLowerCase().includes(search.toLowerCase()),
  );

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

      {/* Filters */}
      <div className="bg-white border border-[#DBDFE9] rounded-lg p-4 mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            <input type="date" value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('common.toDate')}</label>
            <input type="date" value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          </div>
        </div>
        {selectedAccount && (
          <div className="mt-3 flex flex-wrap items-center gap-4 pt-3 border-t border-gray-100">
            <div>
              <span className="text-xs text-gray-500">{t('accounting.ledger.accountLabel')}: </span>
              <span className="text-sm font-semibold text-[#26272F]">{selectedAccount.name}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500">{t('accounting.ledger.currentBalance')}: </span>
              <span className="text-sm font-bold text-green-600">৳{fmt(selectedAccount.currentBalance)}</span>
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
        {/* Search */}
        <div className="p-4 border-b border-[#DBDFE9]">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder={t('accounting.ledger.searchPlaceholder')} value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
          </div>
        </div>

        {/* ── Desktop table ── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {[t('common.date'), t('accounting.ledger.accountLabel'), t('common.type'), t('common.category'),
                  t('common.debitIn'), t('common.creditOut'), t('accounting.ledger.balanceAfter'), t('common.note')].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-[#ff6d29]" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">{t('accounting.ledger.noEntries')}</td></tr>
              ) : filtered.map((entry: any) => (
                <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">{new Date(entry.transactionDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{entry.account?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${typeColors[entry.transactionType] ?? 'bg-gray-100 text-gray-600'}`}>
                      {entry.transactionType?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{entry.category || '—'}</td>
                  <td className="px-4 py-3 text-green-600 font-medium text-xs">
                    {Number(entry.debit) > 0 ? `৳${fmt(entry.debit)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-red-500 font-medium text-xs">
                    {Number(entry.credit) > 0 ? `৳${fmt(entry.credit)}` : '—'}
                  </td>
                  <td className="px-4 py-3 font-bold text-[#26272F] text-xs">৳{fmt(entry.balanceAfter)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-[140px] truncate">{entry.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Mobile cards ── */}
        <div className="md:hidden divide-y divide-gray-100">
          {isLoading ? (
            <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#ff6d29]" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">{t('accounting.ledger.noEntries')}</div>
          ) : filtered.map((entry: any) => (
            <div key={entry.id} className="p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-gray-500 whitespace-nowrap">{new Date(entry.transactionDate).toLocaleDateString()}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize shrink-0 ${typeColors[entry.transactionType] ?? 'bg-gray-100 text-gray-600'}`}>
                  {entry.transactionType?.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                {entry.account?.name && <span className="font-medium text-[#26272F]">{entry.account.name}</span>}
                {entry.category && <><span className="text-gray-300">•</span><span>{entry.category}</span></>}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-green-50 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-gray-400 mb-0.5">IN (Debit)</p>
                  <p className="text-xs font-semibold text-green-600">{Number(entry.debit) > 0 ? `৳${fmt(entry.debit)}` : '—'}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-gray-400 mb-0.5">OUT (Credit)</p>
                  <p className="text-xs font-semibold text-red-500">{Number(entry.credit) > 0 ? `৳${fmt(entry.credit)}` : '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-[10px] text-gray-400 mb-0.5">Balance</p>
                  <p className="text-xs font-bold text-[#26272F]">৳{fmt(entry.balanceAfter)}</p>
                </div>
              </div>
              {entry.note && <p className="text-xs text-gray-400 truncate">{entry.note}</p>}
            </div>
          ))}
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="p-4 border-t border-[#DBDFE9] flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-gray-500">
              {meta.totalItems} {t('common.entries')} — {t('common.page')} {meta.currentPage} {t('common.of')} {meta.totalPages}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50">{t('common.prev')}</button>
              <button onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page === meta.totalPages}
                className="px-3 py-2 border border-[#DBDFE9] rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50">{t('common.next')}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountLedger;
