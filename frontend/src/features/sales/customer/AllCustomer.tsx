import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2, Search, Phone, Mail, Loader2, Eye, Download, Upload, FileDown, X, CheckCircle, AlertCircle } from 'lucide-react';
import PageHeader from '../../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import { useLanguage } from '../../../context/LanguageContext';
import { instance as axiosInstance } from '../../../helpers/axiosInstance';
import {
  useGetAllCustomerTypesQuery,
  useGetAllCustomersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useImportCustomersMutation,
} from '../salesApi';

const API_BASE = `${import.meta.env.VITE_PUBLIC_API_URL}/api/v1`;

// ─── Dynamic type badge ───────────────────────────────────────────────────────

const TypeBadge = ({ type }: { type?: any }) => {
  if (!type) return null;
  const name = typeof type === 'string' ? type : type.name;
  const color = typeof type === 'object' ? type.colorCode : undefined;
  return (
    <span
      style={color ? { backgroundColor: color + '22', color, borderColor: color + '44' } : {}}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${!color ? 'bg-gray-100 text-gray-600 border-gray-200' : ''}`}
    >
      {color && <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />}
      {name}
    </span>
  );
};

// ─── Form initial state ───────────────────────────────────────────────────────

const emptyForm = { name: '', phone: '', email: '', address: '', customerTypeId: '', openingBalance: '' };

// ─── Component ───────────────────────────────────────────────────────────────

const AllCustomer = () => {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: { row: number; message: string }[] } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [debouncedSearch, typeFilter]);

  const { data: typesData = [] } = useGetAllCustomerTypesQuery({});
  const customerTypes: any[] = typesData as any[];
  const defaultType = customerTypes.find((t: any) => t.isDefault);

  const { data, isLoading, isFetching, refetch } = useGetAllCustomersQuery({
    search: debouncedSearch,
    page,
    limit: 15,
    ...(typeFilter && { customerTypeId: typeFilter }),
  });
  const [createCustomer, { isLoading: creating }] = useCreateCustomerMutation();
  const [updateCustomer, { isLoading: updating }] = useUpdateCustomerMutation();
  const [deleteCustomer, { isLoading: deleting }] = useDeleteCustomerMutation();
  const [importCustomers, { isLoading: isImporting }] = useImportCustomersMutation();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await axiosInstance.get(`${API_BASE}/sales/customers/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'customers.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Customers exported successfully');
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await axiosInstance.get(`${API_BASE}/sales/customers/import-template`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'customer-import-template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Could not download template');
    }
  };

  const handleImport = async () => {
    if (!importFile) { toast.error('Please select a file first'); return; }
    const formData = new FormData();
    formData.append('file', importFile);
    try {
      const result = await importCustomers(formData).unwrap();
      setImportResult(result);
      setImportFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (result.success > 0) refetch();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Import failed');
    }
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportFile(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const customers = data?.data ?? [];
  const meta = data?.meta;

  const openAdd = () => {
    setEditItem(null);
    setForm({ ...emptyForm, customerTypeId: defaultType?.id ?? '' });
    setShowModal(true);
  };
  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({
      name: item.name,
      phone: item.phone ?? '',
      email: item.email ?? '',
      address: item.address ?? '',
      customerTypeId: item.customerTypeId ?? item.customerType?.id ?? '',
      openingBalance: '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Customer name is required'); return; }
    if (!form.phone.trim()) { toast.error('Mobile number is required'); return; }
    try {
      if (editItem) {
        await updateCustomer({
          id: editItem.id,
          data: {
            name: form.name, phone: form.phone, email: form.email,
            address: form.address,
            customerTypeId: form.customerTypeId || undefined,
          },
        }).unwrap();
        toast.success('Customer updated');
      } else {
        await createCustomer({
          name: form.name,
          phone: form.phone,
          email: form.email,
          address: form.address,
          customerTypeId: form.customerTypeId || undefined,
          openingBalance: form.openingBalance ? Number(form.openingBalance) : 0,
        }).unwrap();
        toast.success('Customer added');
      }
      setShowModal(false);
    } catch (e: any) {
      toast.error(e?.data?.message ?? 'Failed to save customer');
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await deleteCustomer(deleteItem.id).unwrap();
      toast.success('Customer deleted');
      setDeleteItem(null);
    } catch (e: any) {
      toast.error(e?.data?.message ?? 'Failed to delete customer');
    }
  };

  const totalReceivable = customers
    .filter((c: any) => Number(c.currentBalance) > 0)
    .reduce((s: number, c: any) => s + Number(c.currentBalance), 0);

  return (
    <div>
      <PageHeader
        title={t('sales.customers.title')}
        subtitle={t('sales.customers.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: t('nav.sales'), path: '/admin/sales/list' },
          { label: t('sales.customers.title') },
        ]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handleExport} disabled={isExporting}
              className="flex items-center gap-2 px-3 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-60">
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              Export
            </button>
            <button onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-3 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
              <Upload className="h-4 w-4" /> Import
            </button>
            <button onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors">
              <Plus className="h-4 w-4" /> {t('sales.customers.addCustomer')}
            </button>
          </div>
        }
      />

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-[#DBDFE9] rounded-lg p-4">
          <p className="text-xs text-gray-500">{t('sales.customers.totalCustomers')}</p>
          <p className="text-2xl font-bold text-[#26272F] mt-1">{meta?.totalItems ?? 0}</p>
        </div>
        <div className="bg-white border border-[#DBDFE9] rounded-lg p-4">
          <p className="text-xs text-gray-500">This Page</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{customers.length}</p>
        </div>
        <div className="bg-white border border-[#DBDFE9] rounded-lg p-4">
          <p className="text-xs text-gray-500">{t('sales.customers.totalReceivable')}</p>
          <p className="text-2xl font-bold text-orange-500 mt-1">৳{totalReceivable.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-[#DBDFE9] rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">Filter by Type</p>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full text-sm border-0 outline-none bg-transparent font-semibold text-[#26272F] cursor-pointer"
          >
            <option value="">All Types</option>
            {customerTypes.map((t: any) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        {/* ── Search + Filter Bar ── */}
        <div className="p-4 border-b border-[#DBDFE9] flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('sales.customers.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
            />
          </div>
          <div className="flex items-center gap-3">
            {/* Type filter pills */}
            {customerTypes.length > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setTypeFilter('')}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${typeFilter === '' ? 'bg-[#ff6d29] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >All</button>
                {customerTypes.map((t: any) => (
                  <button
                    key={t.id}
                    onClick={() => setTypeFilter(typeFilter === t.id ? '' : t.id)}
                    style={typeFilter === t.id && t.colorCode ? { backgroundColor: t.colorCode, color: '#fff', borderColor: t.colorCode } : {}}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                      typeFilter === t.id
                        ? 'border-transparent'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-transparent'
                    }`}
                  >{t.name}</button>
                ))}
              </div>
            )}
            <span className="text-sm text-gray-500">
              {isFetching ? t('inventory.products.loading') : `${meta?.totalItems ?? 0} ${t('sales.customers.customersCount')}`}
            </span>
          </div>
        </div>

        {/* ── Desktop Table ── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {['#', 'Customer', 'Mobile', 'Type', 'Address', 'Opening', 'Balance', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-[#ff6d29]" /></td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">{t('sales.customers.noCustomers')}</td></tr>
              ) : (
                customers.map((item: any, idx: number) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500">{(page - 1) * 15 + idx + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#26272F]">{item.name}</p>
                      {item.email && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Mail className="h-3 w-3" />{item.email}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {item.phone
                        ? <div className="flex items-center gap-1.5 text-gray-700 text-sm font-mono"><Phone className="h-3.5 w-3.5 text-gray-400" />{item.phone}</div>
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3"><TypeBadge type={item.customerType} /></td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-[140px] truncate">{item.address || '—'}</td>
                    <td className="px-4 py-3 text-gray-500 font-medium">৳{Number(item.openingBalance).toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold">
                      <span className={Number(item.currentBalance) > 0 ? 'text-orange-500' : 'text-gray-500'}>
                        ৳{Number(item.currentBalance).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link to={`/admin/sales/customers/${item.id}`}
                          className="p-1.5 text-[#ff6d29] hover:bg-orange-50 rounded-lg" title="View">
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button onClick={() => openEdit(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteItem(item)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Mobile Cards ── */}
        <div className="md:hidden divide-y divide-gray-100">
          {isLoading ? (
            <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#ff6d29]" /></div>
          ) : customers.length === 0 ? (
            <div className="py-10 text-center text-gray-400 text-sm">{t('sales.customers.noCustomers')}</div>
          ) : (
            customers.map((item: any) => (
              <div key={item.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-[#26272F] text-sm">{item.name}</p>
                    {item.phone && (
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Phone className="h-3 w-3" /> {item.phone}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TypeBadge type={item.customerType} />
                    <Link to={`/admin/sales/customers/${item.id}`}
                      className="p-1.5 text-[#ff6d29] hover:bg-orange-50 rounded-lg">
                      <Eye className="h-4 w-4" />
                    </Link>
                    <button onClick={() => openEdit(item)}
                      className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setDeleteItem(item)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Opening: ৳{Number(item.openingBalance).toLocaleString()}</span>
                  <span className={`font-semibold ${Number(item.currentBalance) > 0 ? 'text-orange-500' : 'text-gray-500'}`}>
                    Balance: ৳{Number(item.currentBalance).toLocaleString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Pagination ── */}
        {meta && meta.totalPages > 1 && (
          <div className="p-4 border-t border-[#DBDFE9] flex items-center justify-between">
            <span className="text-sm text-gray-500">{t('common.page')} {meta.currentPage} {t('common.of')} {meta.totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-sm border border-[#DBDFE9] rounded-lg disabled:opacity-40 hover:bg-gray-50">
                {t('common.prev')}
              </button>
              <button disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-sm border border-[#DBDFE9] rounded-lg disabled:opacity-40 hover:bg-gray-50">
                {t('common.next')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Import Modal ── */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#DBDFE9]">
              <h2 className="text-lg font-semibold text-[#26272F]">Import Customers</h2>
              <button onClick={closeImportModal} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5 text-gray-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              {!importResult ? (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                    <p className="font-medium mb-1">Import Format</p>
                    <p>Upload an Excel (.xlsx) or CSV file with columns: <strong>name, phone, email, address, customerType, openingBalance</strong>.</p>
                    <p className="mt-1">customerType values: <strong>regular, party, wholesale, retailer, vip</strong> (default: regular)</p>
                  </div>
                  <button onClick={handleDownloadTemplate}
                    className="flex items-center gap-2 text-sm text-[#ff6d29] hover:underline">
                    <FileDown className="h-4 w-4" /> Download template file
                  </button>
                  <div onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#DBDFE9] rounded-lg p-8 text-center cursor-pointer hover:border-[#ff6d29] hover:bg-orange-50/30 transition-colors">
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    {importFile
                      ? <p className="text-sm font-medium text-[#26272F]">{importFile.name}</p>
                      : <p className="text-sm text-gray-500">Click to select an Excel or CSV file</p>}
                    <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                      onChange={(e) => setImportFile(e.target.files?.[0] ?? null)} />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button onClick={closeImportModal}
                      className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                    <button onClick={handleImport} disabled={!importFile || isImporting}
                      className="px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] disabled:opacity-60 flex items-center gap-2">
                      {isImporting && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isImporting ? 'Importing…' : 'Import Customers'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className={`rounded-lg p-4 ${importResult.failed === 0 ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {importResult.failed === 0
                        ? <CheckCircle className="h-5 w-5 text-green-600" />
                        : <AlertCircle className="h-5 w-5 text-yellow-600" />}
                      <span className="font-semibold text-gray-800">Import Complete</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      <span className="text-green-700 font-medium">{importResult.success} succeeded</span>
                      {importResult.failed > 0 && <>, <span className="text-red-600 font-medium">{importResult.failed} failed</span></>}
                    </p>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="max-h-48 overflow-y-auto border border-red-200 rounded-lg">
                      <table className="w-full text-xs">
                        <thead className="bg-red-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-red-700 font-semibold">Row</th>
                            <th className="px-3 py-2 text-left text-red-700 font-semibold">Error</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-red-100">
                          {importResult.errors.map((e) => (
                            <tr key={e.row}><td className="px-3 py-2 text-gray-600">{e.row}</td><td className="px-3 py-2 text-gray-700">{e.message}</td></tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="flex justify-end">
                    <button onClick={closeImportModal}
                      className="px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]">Done</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-[#26272F] mb-4">
              {editItem ? t('sales.customers.editTitle') : t('sales.customers.addTitle')}
            </h2>
            <div className="space-y-3">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('sales.customers.customerName')} <span className="text-red-500">*</span>
                </label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Full name"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>

              {/* Mobile (required) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="01XXXXXXXXX"
                    className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] ${!form.phone.trim() ? 'border-orange-300 bg-orange-50' : 'border-[#DBDFE9]'}`}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Unique per business — cannot be duplicated</p>
              </div>

              {/* Customer Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Type</label>
                {customerTypes.length === 0 ? (
                  <p className="text-xs text-gray-400">
                    No types yet —{' '}
                    <a href="/admin/sales/customer-types" target="_blank" className="text-[#ff6d29] hover:underline">create types here</a>
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, customerTypeId: '' })}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        !form.customerTypeId ? 'border-[#ff6d29] bg-orange-50 text-[#ff6d29]' : 'border-[#DBDFE9] text-gray-500 hover:border-gray-300'
                      }`}
                    >None</button>
                    {customerTypes.map((t: any) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setForm({ ...form, customerTypeId: t.id })}
                        style={form.customerTypeId === t.id && t.colorCode
                          ? { borderColor: t.colorCode, backgroundColor: t.colorCode + '18', color: t.colorCode }
                          : {}}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          form.customerTypeId === t.id
                            ? ''
                            : 'border-[#DBDFE9] text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.customers.email')}</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@example.com"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.customers.address')}</label>
                <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                  rows={2} placeholder="Address"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] resize-none" />
              </div>

              {/* Opening Balance — add only */}
              {!editItem && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('sales.customers.openingBalance')}</label>
                  <input type="number" min="0" value={form.openingBalance}
                    onChange={(e) => setForm({ ...form, openingBalance: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]" />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-5 justify-end">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
                {t('common.cancel')}
              </button>
              <button onClick={handleSave} disabled={creating || updating}
                className="px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] disabled:opacity-60 flex items-center gap-2">
                {(creating || updating) && <Loader2 className="h-4 w-4 animate-spin" />}
                {editItem ? t('common.update') : t('sales.customers.addCustomer')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{t('sales.customers.deleteTitle')}</h3>
            <p className="text-sm text-gray-500 mb-6">
              {t('sales.customers.deleteWarning')} <span className="font-medium">{deleteItem.name}</span>.
            </p>
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

export default AllCustomer;
