import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Package, Trash2, Download, Upload, FileDown, X, CheckCircle, AlertCircle, Printer } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDebounce } from '../../../../hooks/useDebounce';
import { useGetAllProductsQuery, useDeleteProductMutation, useImportProductsMutation } from '../productApi';
import CommonPagination from '../../../../components/ui/paginations/CommonPagination';
import { ImageDisplay } from '../../../../components/ui/modal/ImageDisply';
import PageHeader from '../../../../components/shared/PageHeader';
import { useLanguage } from '../../../../context/LanguageContext';
import { instance as axiosInstance } from '../../../../helpers/axiosInstance';
import BarcodePrintModal, { type BarcodePrintProduct } from '../../../../components/shared/BarcodePrintModal';

const API_BASE = `${import.meta.env.VITE_PUBLIC_API_URL}/api/v1`;

const AllProduct = () => {
  const { t } = useLanguage();
  const [searchValue, setSearchValue] = useState({ search: '', limit: 10, page: 1 });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [printProduct, setPrintProduct] = useState<BarcodePrintProduct | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors: { row: number; message: string }[];
  } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(searchValue.search, 500);

  const {
    data: productData,
    isFetching,
    refetch,
  } = useGetAllProductsQuery({
    ...searchValue,
    search: debouncedSearch,
  });

  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();
  const [importProducts, { isLoading: isImporting }] = useImportProductsMutation();

  const products = productData?.data || [];
  const meta = productData?.meta || { totalItems: 0, totalPages: 1 };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id).unwrap();
      toast.success('Product deleted');
      setConfirmDeleteId(null);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete product');
      setConfirmDeleteId(null);
    }
  };

  // Download export file using axios (needs auth header)
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await axiosInstance.get(`${API_BASE}/inventory/products/export`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'products.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Products exported successfully');
    } catch {
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Download import template using axios (needs auth header)
  const handleDownloadTemplate = async () => {
    try {
      const response = await axiosInstance.get(`${API_BASE}/inventory/products/import-template`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'product-import-template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Could not download template');
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error('Please select a file first');
      return;
    }
    const formData = new FormData();
    formData.append('file', importFile);
    try {
      const result = await importProducts(formData).unwrap();
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

  const tableHeaders = [
    '#',
    t('common.image'),
    t('common.name'),
    t('common.type'),
    t('common.sku'),
    t('common.price'),
    t('common.stock'),
    t('common.variant'),
    t('common.status'),
    t('common.actions'),
  ];

  return (
    <div>
      <BarcodePrintModal product={printProduct} onClose={() => setPrintProduct(null)} />

      {/* Delete confirmation dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Delete Product</p>
                <p className="text-sm text-gray-500 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={isDeleting}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-60"
              >
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#DBDFE9]">
              <div>
                <h3 className="font-semibold text-gray-800">Import Products</h3>
                <p className="text-xs text-gray-500 mt-0.5">Upload an Excel (.xlsx) or CSV file</p>
              </div>
              <button
                onClick={closeImportModal}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {!importResult ? (
                <>
                  {/* Template download */}
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center gap-3">
                    <FileDown className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-800">Download Template</p>
                      <p className="text-xs text-blue-600 mt-0.5">
                        Use this template to format your data correctly
                      </p>
                    </div>
                    <button
                      onClick={handleDownloadTemplate}
                      className="px-3 py-1.5 text-xs font-medium text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap"
                    >
                      Download
                    </button>
                  </div>

                  {/* Template columns info */}
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-600 mb-1">Required columns:</p>
                    <p className="text-xs text-gray-500 font-mono leading-relaxed">
                      name, sku, barcode, productType, description, purchasePrice,
                      sellingPrice, wholesalePrice, openingStock, alertQuantity,
                      categoryName, unitName, brandName
                    </p>
                  </div>

                  {/* File input */}
                  <div
                    className="border-2 border-dashed border-[#DBDFE9] rounded-lg p-6 text-center cursor-pointer hover:border-[#ff6d29] transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    {importFile ? (
                      <div>
                        <p className="text-sm font-medium text-gray-700">{importFile.name}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {(importFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-500">Click to select file</p>
                        <p className="text-xs text-gray-400 mt-1">.xlsx or .csv supported</p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                    />
                  </div>

                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={closeImportModal}
                      className="flex-1 py-2.5 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleImport}
                      disabled={!importFile || isImporting}
                      className="flex-1 py-2.5 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isImporting ? 'Importing…' : 'Import Products'}
                    </button>
                  </div>
                </>
              ) : (
                /* Import result */
                <>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex-1 bg-green-50 rounded-lg p-3 text-center">
                      <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-1" />
                      <p className="text-xl font-bold text-green-700">{importResult.success}</p>
                      <p className="text-xs text-green-600">Imported</p>
                    </div>
                    <div className="flex-1 bg-red-50 rounded-lg p-3 text-center">
                      <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
                      <p className="text-xl font-bold text-red-600">{importResult.failed}</p>
                      <p className="text-xs text-red-500">Failed</p>
                    </div>
                  </div>

                  {importResult.errors.length > 0 && (
                    <div className="max-h-48 overflow-y-auto border border-red-100 rounded-lg divide-y divide-red-50">
                      {importResult.errors.map((e, i) => (
                        <div key={i} className="px-3 py-2">
                          <span className="text-xs font-medium text-red-600">Row {e.row}: </span>
                          <span className="text-xs text-red-500">{e.message}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-3 mt-5">
                    <button
                      onClick={() => setImportResult(null)}
                      className="flex-1 py-2.5 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50"
                    >
                      Import More
                    </button>
                    <button
                      onClick={closeImportModal}
                      className="flex-1 py-2.5 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]"
                    >
                      Done
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <PageHeader
        title={t('inventory.products.title')}
        subtitle={t('inventory.products.subtitle')}
        breadcrumbs={[
          { label: t('common.home'), path: '/admin' },
          { label: t('nav.inventory'), path: '/admin/inventory/products' },
          { label: t('inventory.products.title') },
        ]}
        actions={
          <Link
            to="/admin/inventory/products/add"
            className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors"
          >
            <Plus className="h-4 w-4" /> {t('inventory.products.addProduct')}
          </Link>
        }
      />

      <div className="bg-white border border-[#DBDFE9] rounded-lg shadow-sm">
        <div className="p-4 border-b border-[#DBDFE9] flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('inventory.products.searchPlaceholder')}
              value={searchValue.search}
              onChange={(e) =>
                setSearchValue({ ...searchValue, search: e.target.value.trim(), page: 1 })
              }
              disabled={isFetching}
              className="pl-9 pr-4 py-2 border border-[#DBDFE9] rounded-lg text-sm w-full focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
            />
          </div>

          {/* Export / Import buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500 mr-1">
              {meta.totalItems} {t('inventory.products.title').toLowerCase()}
            </span>
            <button
              onClick={handleExport}
              disabled={isExporting || meta.totalItems === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-[#DBDFE9] text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Export products to Excel"
            >
              <Download className="h-4 w-4" />
              {isExporting ? 'Exporting…' : 'Export'}
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm border border-[#DBDFE9] text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              title="Import products from Excel"
            >
              <Upload className="h-4 w-4" />
              Import
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-[#DBDFE9]">
                {tableHeaders.map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isFetching ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-400">
                    {t('inventory.products.loading')}
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center">
                    <Package className="h-12 w-12 mx-auto mb-3 text-gray-200" />
                    <p className="text-gray-400 font-medium">
                      {t('inventory.products.noProducts')}
                    </p>
                    <Link
                      to="/admin/inventory/products/add"
                      className="mt-3 inline-flex items-center gap-1 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f]"
                    >
                      <Plus className="h-4 w-4" /> {t('inventory.products.addFirstProduct')}
                    </Link>
                  </td>
                </tr>
              ) : (
                products.map((product: any, index: number) => {
                  const thumbnail =
                    product.image || [...(product?.images ?? [])].find((img: any) => img.isThumbnail)?.url || '';
                  const totalStock = (product.stocks ?? []).reduce(
                    (sum: number, s: any) => sum + Number(s.currentQty ?? 0),
                    0,
                  );
                  return (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500">
                        {(searchValue.page - 1) * searchValue.limit + index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <ImageDisplay
                          src={thumbnail}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover border border-[#DBDFE9]"
                        />
                      </td>
                      <td className="px-4 py-3 font-medium text-[#26272F] max-w-[180px]">
                        <span className="line-clamp-2">{product.name}</span>
                      </td>
                      <td className="px-4 py-3 capitalize text-gray-600">
                        {product.productType ?? product.type ?? '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        {product.sku || '—'}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        ৳{Number(product.sellingPrice ?? 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {totalStock.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${product.hasVariants ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}
                        >
                          {product.hasVariants
                            ? t('inventory.products.variantYes')
                            : t('inventory.products.variantNo')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'}`}
                        >
                          {product.isActive
                            ? t('inventory.products.statusActive')
                            : t('inventory.products.statusInactive')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/admin/inventory/products/edit/${product.id}`}
                            className="px-3 py-1.5 text-xs border border-[#DBDFE9] text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            {t('common.edit')}
                          </Link>
                          {product.barcode && (
                            <button
                              onClick={() =>
                                setPrintProduct({
                                  id: product.id,
                                  name: product.name,
                                  barcode: product.barcode,
                                  sku: product.sku,
                                  sellingPrice: product.sellingPrice,
                                })
                              }
                              className="p-1.5 text-gray-400 hover:text-[#ff6d29] hover:bg-orange-50 rounded-lg transition-colors"
                              title="Print barcode label"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setConfirmDeleteId(product.id)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete product"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {products.length > 0 && (
          <div className="p-4 border-t border-[#DBDFE9]">
            <CommonPagination
              total={meta.totalItems}
              totalPage={meta.totalPages}
              setSearchValue={setSearchValue}
              searchValue={searchValue}
              refetch={refetch}
              limit={searchValue.limit}
              page={searchValue.page}
              disabled={isFetching}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AllProduct;
