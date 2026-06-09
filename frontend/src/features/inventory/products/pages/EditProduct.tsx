import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, RefreshCw, Printer } from 'lucide-react';
import JsBarcode from 'jsbarcode';
import toast from 'react-hot-toast';
import { useGetSingleProductQuery, useUpdateProductMutation } from '../productApi';
import { useGetAllCategoryQuery } from '../../category/categoryApi';
import { useGetAllBrandQuery } from '../../brand/brandApi';
import { useGetAllUnitQuery } from '../../unit/unitApi';
import { useGetAllWarrantyQuery } from '../../warranty/warrantyApi';
import { useGetAllWarehouseQuery } from '../../warehouse/warehouseApi';
import PageHeader from '../../../../components/shared/PageHeader';
import BarcodePrintModal from '../../../../components/shared/BarcodePrintModal';
import { generateEAN13 } from '../../../../utils/barcodeUtils';

const F = ({ label, required, error, children }: any) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const inp = (err?: any) =>
  `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] ${err ? 'border-red-300' : 'border-[#DBDFE9]'}`;

function BarcodePreview({ value }: { value: string }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;
    try {
      JsBarcode(svgRef.current, value, {
        format: value.length === 13 ? 'EAN13' : 'CODE128',
        width: 1.5,
        height: 40,
        displayValue: true,
        fontSize: 9,
        margin: 4,
      });
    } catch {
      try {
        JsBarcode(svgRef.current, value, {
          format: 'CODE128',
          width: 1.5,
          height: 40,
          displayValue: true,
          fontSize: 9,
          margin: 4,
        });
      } catch { /* invalid */ }
    }
  }, [value]);

  if (!value) return null;
  return (
    <div className="mt-2 flex justify-center p-2 bg-white border border-dashed border-[#DBDFE9] rounded-lg">
      <svg ref={svgRef} />
    </div>
  );
}

const EditProduct = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [printProduct, setPrintProduct] = useState<any | null>(null);

  const { data: productRes, isLoading: isFetching } = useGetSingleProductQuery(id as string);
  const product = productRes;

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { isActive: true, productType: 'physical', barcode: '' },
  });

  const barcodeValue = watch('barcode') as string;
  const nameValue = watch('name') as string;
  const sellingPriceValue = watch('sellingPrice') as number;
  const skuValue = watch('sku') as string;

  const { data: catData } = useGetAllCategoryQuery({ limit: 500 });
  const { data: brandData } = useGetAllBrandQuery({ limit: 500 });
  const { data: unitData } = useGetAllUnitQuery({ limit: 500 });
  const { data: warrantyData } = useGetAllWarrantyQuery({ limit: 500 });
  const { data: warehouseData } = useGetAllWarehouseQuery({ limit: 500 });
  const [updateProduct, { isLoading }] = useUpdateProductMutation();

  const categories = catData?.data || [];
  const brands = brandData?.data || [];
  const units = unitData?.data || [];
  const warranties = warrantyData?.data || [];
  const warehouses: any[] = warehouseData?.data || [];

  useEffect(() => {
    if (product) {
      const defaultWarehouseId =
        product.warehouseId ||
        warehouses.find((w: any) => w.isDefault)?.id ||
        '';
      reset({
        name: product.name || '',
        sku: product.sku || '',
        barcode: product.barcode || '',
        productType: product.productType || 'physical',
        description: product.description || '',
        purchasePrice: product.purchasePrice ?? '',
        sellingPrice: product.sellingPrice ?? '',
        wholesalePrice: product.wholesalePrice ?? '',
        openingStock: product.openingStock ?? '',
        alertQuantity: product.alertQuantity ?? '',
        categoryId: product.categoryId || '',
        brandId: product.brandId || '',
        unitId: product.unitId || '',
        warrantyId: product.warrantyId || '',
        warehouseId: defaultWarehouseId,
        isActive: product.isActive ?? true,
      });
    }
  }, [product?.id, warehouses.length]);

  const handleGenerateBarcode = () => {
    setValue('barcode', generateEAN13(), { shouldDirty: true });
  };

  const handleOpenPrint = () => {
    if (!barcodeValue) {
      toast.error('Generate or enter a barcode first');
      return;
    }
    setPrintProduct({
      id: id ?? '',
      name: nameValue || product?.name || '',
      barcode: barcodeValue,
      sku: skuValue || product?.sku || '',
      sellingPrice: sellingPriceValue || product?.sellingPrice,
    });
  };

  const onSubmit = async (data: any) => {
    const payload: any = {
      name: data.name,
      productType: data.productType,
      isActive: data.isActive,
    };
    if (data.sku !== undefined) payload.sku = data.sku;
    if (data.barcode) payload.barcode = data.barcode;
    if (data.description) payload.description = data.description;
    if (data.categoryId) payload.categoryId = data.categoryId;
    if (data.brandId) payload.brandId = data.brandId;
    if (data.unitId) payload.unitId = data.unitId;
    if (data.warrantyId) payload.warrantyId = data.warrantyId;
    if (data.warehouseId) payload.warehouseId = data.warehouseId;
    if (data.purchasePrice !== '') payload.purchasePrice = Number(data.purchasePrice);
    if (data.sellingPrice !== '') payload.sellingPrice = Number(data.sellingPrice);
    if (data.wholesalePrice !== '') payload.wholesalePrice = Number(data.wholesalePrice);
    if (data.openingStock !== '') payload.openingStock = Number(data.openingStock);
    if (data.alertQuantity !== '') payload.alertQuantity = Number(data.alertQuantity);

    try {
      const res = await updateProduct({ id, data: payload }).unwrap();
      if (res?.success) {
        toast.success('Product updated');
        navigate('/admin/inventory/products');
      } else {
        toast.error(res?.message || 'Update failed');
      }
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update product');
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#ff6d29] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <BarcodePrintModal product={printProduct} onClose={() => setPrintProduct(null)} />

      <PageHeader
        title="Edit Product"
        subtitle={product?.name || 'Edit product details'}
        breadcrumbs={[
          { label: 'Home', path: '/admin' },
          { label: 'Products', path: '/admin/inventory/products' },
          { label: 'Edit Product' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {barcodeValue && (
              <button
                type="button"
                onClick={handleOpenPrint}
                className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                <Printer className="h-4 w-4" /> Print Barcode
              </button>
            )}
            <Link to="/admin/inventory/products"
              className="flex items-center gap-2 px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
          </div>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white border border-[#DBDFE9] rounded-lg p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">Basic Information</h3>

              <F label="Product Name" required error={errors.name?.message as string}>
                <input {...register('name', { required: 'Name is required' })} placeholder="Product name"
                  className={inp(errors.name)} />
              </F>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="SKU">
                  <input {...register('sku')} placeholder="SKU" className={inp()} />
                </F>

                <F label="Barcode">
                  <div className="flex gap-2">
                    <input
                      {...register('barcode')}
                      placeholder="Barcode"
                      className={`${inp()} flex-1 min-w-0`}
                    />
                    <button
                      type="button"
                      onClick={handleGenerateBarcode}
                      title="Auto-generate EAN-13 barcode"
                      className="flex-shrink-0 px-3 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-xs hover:bg-gray-50 hover:border-[#ff6d29] transition-colors flex items-center gap-1"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Generate</span>
                    </button>
                    {barcodeValue && (
                      <button
                        type="button"
                        onClick={handleOpenPrint}
                        title="Print barcode label"
                        className="flex-shrink-0 px-3 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-xs hover:bg-gray-50 hover:border-[#ff6d29] transition-colors flex items-center gap-1"
                      >
                        <Printer className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <BarcodePreview value={barcodeValue} />
                </F>
              </div>

              <F label="Description">
                <textarea {...register('description')} rows={3}
                  placeholder="Product description"
                  className={`${inp()} resize-none`} />
              </F>
            </div>

            {/* Pricing & Stock */}
            <div className="bg-white border border-[#DBDFE9] rounded-lg p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">Pricing & Stock</h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <F label="Purchase Price">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">৳</span>
                    <input type="number" step="0.01" min="0" {...register('purchasePrice')}
                      placeholder="0.00" className={`${inp()} pl-7`} />
                  </div>
                </F>
                <F label="Selling Price">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">৳</span>
                    <input type="number" step="0.01" min="0" {...register('sellingPrice')}
                      placeholder="0.00" className={`${inp()} pl-7`} />
                  </div>
                </F>
                <F label="Wholesale Price">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">৳</span>
                    <input type="number" step="0.01" min="0" {...register('wholesalePrice')}
                      placeholder="0.00" className={`${inp()} pl-7`} />
                  </div>
                </F>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <F label="Opening Stock">
                  <input type="number" min="0" step="any" {...register('openingStock')}
                    placeholder="0" className={inp()} />
                </F>
                <F label="Alert Quantity">
                  <input type="number" min="0" {...register('alertQuantity')}
                    placeholder="e.g. 5" className={inp()} />
                </F>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-5">
            <div className="bg-white border border-[#DBDFE9] rounded-lg p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">Organization</h3>

              <F label="Product Type">
                <select {...register('productType')} className={inp()}>
                  <option value="physical">Physical</option>
                  <option value="digital">Digital</option>
                  <option value="service">Service</option>
                </select>
              </F>

              <F label="Category">
                <select {...register('categoryId')} className={inp()}>
                  <option value="">Select category...</option>
                  {categories.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </F>

              <F label="Brand">
                <select {...register('brandId')} className={inp()}>
                  <option value="">Select brand...</option>
                  {brands.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </F>

              <F label="Unit">
                <select {...register('unitId')} className={inp()}>
                  <option value="">Select unit...</option>
                  {units.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </F>

              <F label="Warranty">
                <select {...register('warrantyId')} className={inp()}>
                  <option value="">No warranty</option>
                  {warranties.map((w: any) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </F>

              <F label="Warehouse">
                <select {...register('warehouseId')} className={inp()}>
                  <option value="">Business profile (default)</option>
                  {warehouses.map((w: any) => (
                    <option key={w.id} value={w.id}>
                      {w.name}{w.isDefault ? ' ★ Default' : ''}
                    </option>
                  ))}
                </select>
              </F>
            </div>

            {/* Status */}
            <div className="bg-white border border-[#DBDFE9] rounded-lg p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Active Status</p>
                  <p className="text-xs text-gray-400 mt-0.5">Visible in inventory</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" {...register('isActive')} className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-200 peer-checked:bg-[#ff6d29] rounded-full transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Link to="/admin/inventory/products"
                className="flex-1 py-2.5 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm text-center hover:bg-gray-50">
                Cancel
              </Link>
              <button type="submit" disabled={isLoading || isSubmitting}
                className="flex-1 py-2.5 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] disabled:opacity-60 flex items-center justify-center gap-2">
                {(isLoading || isSubmitting) && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <Save size={14} /> Update Product
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;
