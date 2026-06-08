import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Pencil, Trash2, Wallet, Building2, Smartphone,
  Loader2, TrendingUp, TrendingDown, ArrowLeftRight,
  BookOpen, MoreVertical, X, ChevronRight,
} from 'lucide-react';
import CategorySelect from './CategorySelect';
import PageHeader from '../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import {
  useGetAllAccountsQuery,
  useGetAccountSummaryQuery,
  useCreateAccountMutation,
  useUpdateAccountMutation,
  useDeleteAccountMutation,
  useRecordIncomeMutation,
  useRecordExpenseMutation,
  useTransferFundsMutation,
} from './accountingApi';
import { useLanguage } from '../../context/LanguageContext';

// ─── types ───────────────────────────────────────────────────────────────────
type AccountType = 'cash' | 'bank' | 'mobile_banking';

interface Account {
  id: string;
  name: string;
  accountType: AccountType;
  openingBalance: number;
  currentBalance: number;
  bankName?: string;
  accountNumber?: string;
  description?: string;
}

// ─── config ──────────────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<AccountType, {
  label: string;
  icon: React.ReactNode;
  headerBg: string;
  iconBg: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  balanceColor: string;
  borderAccent: string;
  emptyIcon: React.ReactNode;
}> = {
  cash: {
    label: 'Cash Accounts',
    icon: <Wallet className="h-5 w-5" />,
    headerBg: 'bg-gradient-to-r from-green-500 to-emerald-600',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    badgeBg: 'bg-green-100',
    badgeText: 'text-green-700',
    balanceColor: 'text-green-700',
    borderAccent: 'border-l-green-500',
    emptyIcon: <Wallet className="h-10 w-10 text-green-300" />,
  },
  bank: {
    label: 'Bank Accounts',
    icon: <Building2 className="h-5 w-5" />,
    headerBg: 'bg-gradient-to-r from-blue-500 to-indigo-600',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-700',
    balanceColor: 'text-blue-700',
    borderAccent: 'border-l-blue-500',
    emptyIcon: <Building2 className="h-10 w-10 text-blue-300" />,
  },
  mobile_banking: {
    label: 'Mobile Banking',
    icon: <Smartphone className="h-5 w-5" />,
    headerBg: 'bg-gradient-to-r from-purple-500 to-violet-600',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-700',
    balanceColor: 'text-purple-700',
    borderAccent: 'border-l-purple-500',
    emptyIcon: <Smartphone className="h-10 w-10 text-purple-300" />,
  },
};

const ACCOUNT_TYPES: AccountType[] = ['cash', 'bank', 'mobile_banking'];

const emptyAccountForm = {
  name: '', accountType: 'cash' as AccountType,
  openingBalance: '', description: '', bankName: '', accountNumber: '',
};

const emptyTxForm = { amount: '', category: '', transactionDate: new Date().toISOString().slice(0, 10), note: '' };
const emptyTransferForm = { toAccountId: '', amount: '', transactionDate: new Date().toISOString().slice(0, 10), note: '' };

// ─── DropMenu ─────────────────────────────────────────────────────────────────
const DropMenu = ({
  onEdit, onDelete,
}: { onEdit: () => void; onDelete: () => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 bg-white border border-[#DBDFE9] rounded-lg shadow-lg w-36 py-1">
          <button
            onClick={() => { setOpen(false); onEdit(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <Pencil className="h-4 w-4 text-blue-500" /> Edit
          </button>
          <button
            onClick={() => { setOpen(false); onDelete(); }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      )}
    </div>
  );
};

// ─── AccountCard ──────────────────────────────────────────────────────────────
const AccountCard = ({
  account,
  allAccounts,
  onEdit,
  onDelete,
  onIncome,
  onExpense,
  onTransfer,
  onLedger,
}: {
  account: Account;
  allAccounts: Account[];
  onEdit: (a: Account) => void;
  onDelete: (a: Account) => void;
  onIncome: (a: Account) => void;
  onExpense: (a: Account) => void;
  onTransfer: (a: Account) => void;
  onLedger: (a: Account) => void;
}) => {
  const cfg = TYPE_CONFIG[account.accountType];
  const diff = Number(account.currentBalance) - Number(account.openingBalance);
  const isPositive = diff >= 0;

  return (
    <div className={`bg-white rounded-xl border border-[#DBDFE9] border-l-4 ${cfg.borderAccent} shadow-sm hover:shadow-md transition-shadow group`}>
      {/* Card Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`flex-shrink-0 h-10 w-10 rounded-xl ${cfg.iconBg} ${cfg.iconColor} flex items-center justify-center`}>
              {cfg.icon}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-[#26272F] truncate">{account.name}</h3>
              {account.bankName && (
                <p className="text-xs text-gray-400 truncate">{account.bankName}</p>
              )}
              {account.accountNumber && (
                <p className="text-xs text-gray-400 font-mono">{account.accountNumber}</p>
              )}
            </div>
          </div>
          <DropMenu onEdit={() => onEdit(account)} onDelete={() => onDelete(account)} />
        </div>
      </div>

      {/* Balance */}
      <div className="px-4 pb-3">
        <p className="text-xs text-gray-500 mb-0.5">Current Balance</p>
        <p className={`text-2xl font-bold ${cfg.balanceColor}`}>
          ৳{Number(account.currentBalance).toLocaleString('en-BD')}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          {isPositive
            ? <TrendingUp className="h-3 w-3 text-green-500" />
            : <TrendingDown className="h-3 w-3 text-red-400" />
          }
          <span className={`text-xs ${isPositive ? 'text-green-600' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}৳{Math.abs(diff).toLocaleString('en-BD')} from opening
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          Opening: ৳{Number(account.openingBalance).toLocaleString('en-BD')}
        </p>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-gray-100" />

      {/* Quick Actions */}
      <div className="p-3 grid grid-cols-4 gap-1.5">
        <button
          onClick={() => onIncome(account)}
          className="flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-green-50 text-green-600 transition-colors group"
          title="Record Income"
        >
          <div className="h-7 w-7 rounded-lg bg-green-100 flex items-center justify-center">
            <TrendingUp className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-medium">Income</span>
        </button>
        <button
          onClick={() => onExpense(account)}
          className="flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
          title="Record Expense"
        >
          <div className="h-7 w-7 rounded-lg bg-red-100 flex items-center justify-center">
            <TrendingDown className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-medium">Expense</span>
        </button>
        <button
          onClick={() => onTransfer(account)}
          className="flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"
          title="Transfer Funds"
          disabled={allAccounts.filter((a) => a.id !== account.id).length === 0}
        >
          <div className="h-7 w-7 rounded-lg bg-blue-100 flex items-center justify-center">
            <ArrowLeftRight className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-medium">Transfer</span>
        </button>
        <button
          onClick={() => onLedger(account)}
          className="flex flex-col items-center gap-1 py-2 rounded-lg hover:bg-orange-50 text-[#ff6d29] transition-colors"
          title="View Ledger"
        >
          <div className="h-7 w-7 rounded-lg bg-orange-100 flex items-center justify-center">
            <BookOpen className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-medium">Ledger</span>
        </button>
      </div>
    </div>
  );
};

// ─── AccountSection ───────────────────────────────────────────────────────────
const AccountSection = ({
  type,
  accounts,
  allAccounts,
  onAddAccount,
  onEdit,
  onDelete,
  onIncome,
  onExpense,
  onTransfer,
  onLedger,
}: {
  type: AccountType;
  accounts: Account[];
  allAccounts: Account[];
  onAddAccount: (t: AccountType) => void;
  onEdit: (a: Account) => void;
  onDelete: (a: Account) => void;
  onIncome: (a: Account) => void;
  onExpense: (a: Account) => void;
  onTransfer: (a: Account) => void;
  onLedger: (a: Account) => void;
}) => {
  const cfg = TYPE_CONFIG[type];
  const total = accounts.reduce((s, a) => s + Number(a.currentBalance), 0);

  return (
    <div className="mb-8">
      {/* Section Header */}
      <div className={`${cfg.headerBg} rounded-xl p-4 mb-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-white/20 flex items-center justify-center text-white">
            {cfg.icon}
          </div>
          <div>
            <h2 className="text-white font-semibold">{cfg.label}</h2>
            <p className="text-white/70 text-xs">
              {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'} · Total: ৳{total.toLocaleString('en-BD')}
            </p>
          </div>
        </div>
        <button
          onClick={() => onAddAccount(type)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
          <div className="flex justify-center mb-3">{cfg.emptyIcon}</div>
          <p className="text-gray-500 font-medium mb-1">No {cfg.label} yet</p>
          <p className="text-gray-400 text-sm mb-4">Create your first account to start tracking transactions</p>
          <button
            onClick={() => onAddAccount(type)}
            className={`inline-flex items-center gap-2 px-4 py-2 ${cfg.iconBg} ${cfg.iconColor} rounded-lg text-sm font-medium hover:opacity-80 transition-opacity`}
          >
            <Plus className="h-4 w-4" /> Add {cfg.label.replace(' Accounts', '').replace(' Banking', ' Banking Account')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((a) => (
            <AccountCard
              key={a.id}
              account={a}
              allAccounts={allAccounts}
              onEdit={onEdit}
              onDelete={onDelete}
              onIncome={onIncome}
              onExpense={onExpense}
              onTransfer={onTransfer}
              onLedger={onLedger}
            />
          ))}
          {/* Add More Card */}
          <button
            onClick={() => onAddAccount(type)}
            className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors min-h-[180px]"
          >
            <div className={`h-10 w-10 rounded-xl ${cfg.iconBg} ${cfg.iconColor} flex items-center justify-center`}>
              <Plus className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium">Add Account</span>
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Modal Wrapper ────────────────────────────────────────────────────────────
const Modal = ({ title, onClose, children, footer }: {
  title: string; onClose: () => void;
  children: React.ReactNode; footer?: React.ReactNode;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-6">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <h2 className="text-base font-semibold text-[#26272F]">{title}</h2>
        <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="p-5 overflow-y-auto flex-1 space-y-4">{children}</div>
      {footer && <div className="p-5 border-t border-gray-100 flex gap-3 justify-end">{footer}</div>}
    </div>
  </div>
);

const inputCls = 'w-full px-3 py-2.5 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

// ─── Main Component ───────────────────────────────────────────────────────────
const AllAccounts = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  // modals
  const [accountModal, setAccountModal] = useState<{ open: boolean; type?: AccountType }>({ open: false });
  const [editItem, setEditItem] = useState<Account | null>(null);
  const [deleteItem, setDeleteItem] = useState<Account | null>(null);
  const [incomeModal, setIncomeModal] = useState<Account | null>(null);
  const [expenseModal, setExpenseModal] = useState<Account | null>(null);
  const [transferModal, setTransferModal] = useState<Account | null>(null);

  // forms
  const [accountForm, setAccountForm] = useState(emptyAccountForm);
  const [txForm, setTxForm] = useState(emptyTxForm);
  const [transferForm, setTransferForm] = useState(emptyTransferForm);

  const { data, isLoading } = useGetAllAccountsQuery({});
  const accounts: Account[] = data || [];
  const { data: summary } = useGetAccountSummaryQuery(undefined);

  const [createAccount, { isLoading: creating }] = useCreateAccountMutation();
  const [updateAccount, { isLoading: updating }] = useUpdateAccountMutation();
  const [deleteAccount, { isLoading: deleting }] = useDeleteAccountMutation();
  const [recordIncome, { isLoading: savingIncome }] = useRecordIncomeMutation();
  const [recordExpense, { isLoading: savingExpense }] = useRecordExpenseMutation();
  const [transferFunds, { isLoading: transferring }] = useTransferFundsMutation();

  const af = (k: string, v: string) => setAccountForm((p) => ({ ...p, [k]: v }));
  const tf = (k: string, v: string) => setTxForm((p) => ({ ...p, [k]: v }));
  const trF = (k: string, v: string) => setTransferForm((p) => ({ ...p, [k]: v }));

  const openAdd = (type?: AccountType) => {
    setEditItem(null);
    setAccountForm({ ...emptyAccountForm, accountType: type ?? 'cash' });
    setAccountModal({ open: true, type });
  };
  const openEdit = (item: Account) => {
    setEditItem(item);
    setAccountForm({
      name: item.name,
      accountType: item.accountType,
      openingBalance: '',
      description: item.description ?? '',
      bankName: item.bankName ?? '',
      accountNumber: item.accountNumber ?? '',
    });
    setAccountModal({ open: true });
  };

  const handleSaveAccount = async () => {
    if (!accountForm.name.trim()) { toast.error('Account name is required'); return; }
    try {
      if (editItem) {
        await updateAccount({ id: editItem.id, data: { name: accountForm.name, description: accountForm.description, bankName: accountForm.bankName, accountNumber: accountForm.accountNumber } }).unwrap();
        toast.success('Account updated');
      } else {
        await createAccount({
          name: accountForm.name,
          accountType: accountForm.accountType,
          openingBalance: accountForm.openingBalance ? Number(accountForm.openingBalance) : 0,
          description: accountForm.description,
          bankName: accountForm.bankName,
          accountNumber: accountForm.accountNumber,
        }).unwrap();
        toast.success('Account created');
      }
      setAccountModal({ open: false });
    } catch (e: any) {
      toast.error(e?.data?.message ?? 'Failed to save account');
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await deleteAccount(deleteItem.id).unwrap();
      toast.success('Account deleted');
      setDeleteItem(null);
    } catch (e: any) {
      toast.error(e?.data?.message ?? 'Cannot delete: account has ledger entries');
    }
  };

  const handleIncome = async () => {
    if (!incomeModal || !txForm.amount) { toast.error('Amount is required'); return; }
    try {
      await recordIncome({ accountId: incomeModal.id, amount: Number(txForm.amount), category: txForm.category || undefined, transactionDate: txForm.transactionDate, note: txForm.note || undefined }).unwrap();
      toast.success('Income recorded');
      setIncomeModal(null);
      setTxForm(emptyTxForm);
    } catch (e: any) {
      toast.error(e?.data?.message ?? 'Failed to record income');
    }
  };

  const handleExpense = async () => {
    if (!expenseModal || !txForm.amount) { toast.error('Amount is required'); return; }
    try {
      await recordExpense({ accountId: expenseModal.id, amount: Number(txForm.amount), category: txForm.category || undefined, transactionDate: txForm.transactionDate, note: txForm.note || undefined }).unwrap();
      toast.success('Expense recorded');
      setExpenseModal(null);
      setTxForm(emptyTxForm);
    } catch (e: any) {
      toast.error(e?.data?.message ?? 'Failed to record expense');
    }
  };

  const handleTransfer = async () => {
    if (!transferModal || !transferForm.amount || !transferForm.toAccountId) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (transferForm.toAccountId === transferModal.id) {
      toast.error('Cannot transfer to the same account');
      return;
    }
    try {
      await transferFunds({ fromAccountId: transferModal.id, toAccountId: transferForm.toAccountId, amount: Number(transferForm.amount), transactionDate: transferForm.transactionDate, note: transferForm.note || undefined }).unwrap();
      toast.success('Transfer successful');
      setTransferModal(null);
      setTransferForm(emptyTransferForm);
    } catch (e: any) {
      toast.error(e?.data?.message ?? 'Transfer failed');
    }
  };

  const openLedger = (account: Account) => {
    navigate(`/admin/accounting/ledger?accountId=${account.id}`);
  };

  const openIncomeModal = (a: Account) => { setIncomeModal(a); setTxForm(emptyTxForm); };
  const openExpenseModal = (a: Account) => { setExpenseModal(a); setTxForm(emptyTxForm); };
  const openTransferModal = (a: Account) => {
    setTransferModal(a);
    const firstOther = accounts.find((x) => x.id !== a.id);
    setTransferForm({ ...emptyTransferForm, toAccountId: firstOther?.id ?? '' });
  };

  const totalAssets = Number(summary?.summary?.totalAssets ?? 0);
  const totalCash = Number(summary?.summary?.totalCash ?? 0);
  const totalBank = Number(summary?.summary?.totalBank ?? 0);
  const totalMobile = Number(summary?.summary?.totalMobileBanking ?? 0);

  const cashAccounts = accounts.filter((a) => a.accountType === 'cash');
  const bankAccounts = accounts.filter((a) => a.accountType === 'bank');
  const mobileAccounts = accounts.filter((a) => a.accountType === 'mobile_banking');

  const cardProps = {
    allAccounts: accounts,
    onEdit: openEdit,
    onDelete: setDeleteItem,
    onIncome: openIncomeModal,
    onExpense: openExpenseModal,
    onTransfer: openTransferModal,
    onLedger: openLedger,
  };

  const needsBankFields = accountForm.accountType === 'bank' || accountForm.accountType === 'mobile_banking';

  return (
    <div>
      <PageHeader
        title={t('accounting.accounts.title')}
        subtitle={t('accounting.accounts.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: t('nav.accounting'), path: '/admin/accounting' },
          { label: t('accounting.accounts.title') },
        ]}
        actions={
          <button
            onClick={() => openAdd()}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors"
          >
            <Plus className="h-4 w-4" /> {t('accounting.accounts.addAccount')}
          </button>
        }
      />

      {/* Summary Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-[#DBDFE9] rounded-xl p-4 col-span-2 lg:col-span-1">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Total Assets</p>
          <p className="text-3xl font-bold text-[#26272F] mt-1">৳{totalAssets.toLocaleString('en-BD')}</p>
          <div className="flex gap-1 mt-3">
            {totalAssets > 0 && (
              <>
                <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${(totalCash / totalAssets) * 100}%` }} />
                <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${(totalBank / totalAssets) * 100}%` }} />
                <div className="h-1.5 rounded-full bg-purple-500" style={{ width: `${(totalMobile / totalAssets) * 100}%` }} />
              </>
            )}
          </div>
          <div className="flex gap-3 mt-2">
            <span className="flex items-center gap-1 text-xs text-gray-400"><span className="h-2 w-2 rounded-full bg-green-500" />Cash</span>
            <span className="flex items-center gap-1 text-xs text-gray-400"><span className="h-2 w-2 rounded-full bg-blue-500" />Bank</span>
            <span className="flex items-center gap-1 text-xs text-gray-400"><span className="h-2 w-2 rounded-full bg-purple-500" />Mobile</span>
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-green-700 font-medium uppercase tracking-wide">Cash</p>
            <div className="h-8 w-8 rounded-lg bg-green-200 flex items-center justify-center">
              <Wallet className="h-4 w-4 text-green-700" />
            </div>
          </div>
          <p className="text-2xl font-bold text-green-800">৳{totalCash.toLocaleString('en-BD')}</p>
          <p className="text-xs text-green-600 mt-1">{cashAccounts.length} account{cashAccounts.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-blue-700 font-medium uppercase tracking-wide">Bank</p>
            <div className="h-8 w-8 rounded-lg bg-blue-200 flex items-center justify-center">
              <Building2 className="h-4 w-4 text-blue-700" />
            </div>
          </div>
          <p className="text-2xl font-bold text-blue-800">৳{totalBank.toLocaleString('en-BD')}</p>
          <p className="text-xs text-blue-600 mt-1">{bankAccounts.length} account{bankAccounts.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-violet-100 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-purple-700 font-medium uppercase tracking-wide">Mobile</p>
            <div className="h-8 w-8 rounded-lg bg-purple-200 flex items-center justify-center">
              <Smartphone className="h-4 w-4 text-purple-700" />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-800">৳{totalMobile.toLocaleString('en-BD')}</p>
          <p className="text-xs text-purple-600 mt-1">{mobileAccounts.length} account{mobileAccounts.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => navigate('/admin/accounting/ledger')}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          <BookOpen className="h-4 w-4 text-[#ff6d29]" /> View Full Ledger <ChevronRight className="h-3 w-3" />
        </button>
        <button
          onClick={() => navigate('/admin/accounting/transactions')}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
        >
          <ArrowLeftRight className="h-4 w-4 text-blue-500" /> All Transactions <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-[#ff6d29]" />
        </div>
      )}

      {/* Account Sections */}
      {!isLoading && (
        <>
          <AccountSection type="cash" accounts={cashAccounts} onAddAccount={openAdd} {...cardProps} />
          <AccountSection type="bank" accounts={bankAccounts} onAddAccount={openAdd} {...cardProps} />
          <AccountSection type="mobile_banking" accounts={mobileAccounts} onAddAccount={openAdd} {...cardProps} />
        </>
      )}

      {/* ── Create / Edit Account Modal ─────────────────────────────────────── */}
      {accountModal.open && (
        <Modal
          title={editItem ? t('accounting.accounts.editAccount') : t('accounting.accounts.addAccount')}
          onClose={() => setAccountModal({ open: false })}
          footer={
            <>
              <button onClick={() => setAccountModal({ open: false })} className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
                {t('common.cancel')}
              </button>
              <button onClick={handleSaveAccount} disabled={creating || updating}
                className="px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] disabled:opacity-60 flex items-center gap-2">
                {(creating || updating) && <Loader2 className="h-4 w-4 animate-spin" />}
                {editItem ? t('common.update') : 'Create Account'}
              </button>
            </>
          }
        >
          <div>
            <label className={labelCls}>{t('accounting.accounts.accountName')} <span className="text-red-500">*</span></label>
            <input value={accountForm.name} onChange={(e) => af('name', e.target.value)}
              placeholder="e.g. Petty Cash" className={inputCls} autoFocus />
          </div>
          {!editItem && (
            <div>
              <label className={labelCls}>{t('accounting.accounts.accountType')}</label>
              <div className="grid grid-cols-3 gap-2">
                {ACCOUNT_TYPES.map((type) => {
                  const cfg = TYPE_CONFIG[type];
                  return (
                    <button
                      key={type}
                      onClick={() => af('accountType', type)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                        accountForm.accountType === type
                          ? `${cfg.iconBg} ${cfg.badgeText} border-current`
                          : 'border-[#DBDFE9] text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      {cfg.icon}
                      <span className="text-xs font-medium capitalize">{type === 'mobile_banking' ? 'Mobile' : type}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {!editItem && (
            <div>
              <label className={labelCls}>{t('accounting.accounts.openingBalance')}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">৳</span>
                <input type="number" min="0" value={accountForm.openingBalance}
                  onChange={(e) => af('openingBalance', e.target.value)}
                  placeholder="0.00" className={`${inputCls} pl-7`} />
              </div>
            </div>
          )}
          {needsBankFields && (
            <>
              <div>
                <label className={labelCls}>{t('accounting.accounts.bankName')}</label>
                <input value={accountForm.bankName} onChange={(e) => af('bankName', e.target.value)}
                  placeholder={accountForm.accountType === 'bank' ? 'e.g. Dutch Bangla Bank' : 'e.g. bKash / Nagad'}
                  className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>{t('accounting.accounts.accountNumber')}</label>
                <input value={accountForm.accountNumber} onChange={(e) => af('accountNumber', e.target.value)}
                  placeholder="Account or wallet number" className={inputCls} />
              </div>
            </>
          )}
          <div>
            <label className={labelCls}>{t('common.description')}</label>
            <textarea value={accountForm.description} onChange={(e) => af('description', e.target.value)}
              rows={2} placeholder="Optional note" className={`${inputCls} resize-none`} />
          </div>
        </Modal>
      )}

      {/* ── Income Modal ─────────────────────────────────────────────────────── */}
      {incomeModal && (
        <Modal
          title={`Record Income — ${incomeModal.name}`}
          onClose={() => setIncomeModal(null)}
          footer={
            <>
              <button onClick={() => setIncomeModal(null)} className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">{t('common.cancel')}</button>
              <button onClick={handleIncome} disabled={savingIncome}
                className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 flex items-center gap-2">
                {savingIncome && <Loader2 className="h-4 w-4 animate-spin" />}
                <TrendingUp className="h-4 w-4" /> Record Income
              </button>
            </>
          }
        >
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
              <Wallet className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-800">{incomeModal.name}</p>
              <p className="text-xs text-green-600">Current: ৳{Number(incomeModal.currentBalance).toLocaleString('en-BD')}</p>
            </div>
          </div>
          <div>
            <label className={labelCls}>Amount <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">৳</span>
              <input type="number" min="0" step="0.01" value={txForm.amount}
                onChange={(e) => tf('amount', e.target.value)}
                placeholder="0.00" className={`${inputCls} pl-7`} autoFocus />
            </div>
          </div>
          <div>
            <label className={labelCls}>Category</label>
            <CategorySelect type="income" value={txForm.category} onChange={(v) => tf('category', v)} />
          </div>
          <div>
            <label className={labelCls}>Date</label>
            <input type="date" value={txForm.transactionDate} onChange={(e) => tf('transactionDate', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Note</label>
            <textarea value={txForm.note} onChange={(e) => tf('note', e.target.value)}
              rows={2} placeholder="Optional note" className={`${inputCls} resize-none`} />
          </div>
        </Modal>
      )}

      {/* ── Expense Modal ────────────────────────────────────────────────────── */}
      {expenseModal && (
        <Modal
          title={`Record Expense — ${expenseModal.name}`}
          onClose={() => setExpenseModal(null)}
          footer={
            <>
              <button onClick={() => setExpenseModal(null)} className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">{t('common.cancel')}</button>
              <button onClick={handleExpense} disabled={savingExpense}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-60 flex items-center gap-2">
                {savingExpense && <Loader2 className="h-4 w-4 animate-spin" />}
                <TrendingDown className="h-4 w-4" /> Record Expense
              </button>
            </>
          }
        >
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-red-100 flex items-center justify-center text-red-500">
              <Wallet className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-medium text-red-700">{expenseModal.name}</p>
              <p className="text-xs text-red-500">Current: ৳{Number(expenseModal.currentBalance).toLocaleString('en-BD')}</p>
            </div>
          </div>
          <div>
            <label className={labelCls}>Amount <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">৳</span>
              <input type="number" min="0" step="0.01" value={txForm.amount}
                onChange={(e) => tf('amount', e.target.value)}
                placeholder="0.00" className={`${inputCls} pl-7`} autoFocus />
            </div>
          </div>
          <div>
            <label className={labelCls}>Category</label>
            <CategorySelect type="expense" value={txForm.category} onChange={(v) => tf('category', v)} />
          </div>
          <div>
            <label className={labelCls}>Date</label>
            <input type="date" value={txForm.transactionDate} onChange={(e) => tf('transactionDate', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Note</label>
            <textarea value={txForm.note} onChange={(e) => tf('note', e.target.value)}
              rows={2} placeholder="Optional note" className={`${inputCls} resize-none`} />
          </div>
        </Modal>
      )}

      {/* ── Transfer Modal ───────────────────────────────────────────────────── */}
      {transferModal && (
        <Modal
          title="Transfer Funds"
          onClose={() => setTransferModal(null)}
          footer={
            <>
              <button onClick={() => setTransferModal(null)} className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">{t('common.cancel')}</button>
              <button onClick={handleTransfer} disabled={transferring}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2">
                {transferring && <Loader2 className="h-4 w-4 animate-spin" />}
                <ArrowLeftRight className="h-4 w-4" /> Transfer
              </button>
            </>
          }
        >
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-500 font-medium mb-0.5">FROM</p>
              <p className="text-sm font-semibold text-blue-800">{transferModal.name}</p>
              <p className="text-xs text-blue-500">৳{Number(transferModal.currentBalance).toLocaleString('en-BD')}</p>
            </div>
            <ArrowLeftRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-3">
              <p className="text-xs text-gray-500 font-medium mb-0.5">TO</p>
              <select value={transferForm.toAccountId} onChange={(e) => trF('toAccountId', e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-gray-700 focus:outline-none">
                <option value="">Select account</option>
                {accounts.filter((a) => a.id !== transferModal.id).map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Amount <span className="text-red-500">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">৳</span>
              <input type="number" min="0" step="0.01" value={transferForm.amount}
                onChange={(e) => trF('amount', e.target.value)}
                placeholder="0.00" className={`${inputCls} pl-7`} autoFocus />
            </div>
          </div>
          <div>
            <label className={labelCls}>Date</label>
            <input type="date" value={transferForm.transactionDate} onChange={(e) => trF('transactionDate', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Note</label>
            <textarea value={transferForm.note} onChange={(e) => trF('note', e.target.value)}
              rows={2} placeholder="Optional note" className={`${inputCls} resize-none`} />
          </div>
        </Modal>
      )}

      {/* ── Delete Confirm Modal ─────────────────────────────────────────────── */}
      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="h-14 w-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-7 w-7 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('accounting.accounts.deleteTitle')}</h3>
            <p className="text-sm text-gray-500 mb-1">{deleteItem.name}</p>
            <p className="text-sm text-gray-400 mb-6">{t('accounting.accounts.deleteWarning')}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteItem(null)}
                className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm">
                {t('common.cancel')}
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-60 flex items-center gap-2">
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />} {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllAccounts;
