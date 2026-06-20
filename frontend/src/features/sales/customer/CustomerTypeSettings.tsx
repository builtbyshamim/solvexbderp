import { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, Tag, Star, GripVertical } from 'lucide-react';
import PageHeader from '../../../components/shared/PageHeader';
import toast from 'react-hot-toast';
import {
  useGetAllCustomerTypesQuery,
  useCreateCustomerTypeMutation,
  useUpdateCustomerTypeMutation,
  useDeleteCustomerTypeMutation,
} from '../salesApi';

// ─── Preset colors ────────────────────────────────────────────────────────────

const PRESET_COLORS = [
  { hex: '#3B82F6', name: 'Blue' },
  { hex: '#8B5CF6', name: 'Purple' },
  { hex: '#F59E0B', name: 'Amber' },
  { hex: '#10B981', name: 'Green' },
  { hex: '#EF4444', name: 'Red' },
  { hex: '#EC4899', name: 'Pink' },
  { hex: '#06B6D4', name: 'Cyan' },
  { hex: '#F97316', name: 'Orange' },
  { hex: '#6B7280', name: 'Gray' },
  { hex: '#14B8A6', name: 'Teal' },
];

const TypeBadge = ({ name, colorCode }: { name: string; colorCode?: string }) => (
  <span
    style={colorCode ? { backgroundColor: colorCode + '22', color: colorCode, borderColor: colorCode + '44' } : {}}
    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${!colorCode ? 'bg-gray-100 text-gray-600 border-gray-200' : ''}`}
  >
    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colorCode ?? '#6B7280' }} />
    {name}
  </span>
);

// ─── Empty form ───────────────────────────────────────────────────────────────

const emptyForm = { name: '', colorCode: PRESET_COLORS[0].hex, isDefault: false, sortOrder: 0 };

// ─── Component ───────────────────────────────────────────────────────────────

const CustomerTypeSettings = () => {
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteItem, setDeleteItem] = useState<any>(null);

  const { data: types = [], isLoading } = useGetAllCustomerTypesQuery({});
  const [createType, { isLoading: creating }] = useCreateCustomerTypeMutation();
  const [updateType, { isLoading: updating }] = useUpdateCustomerTypeMutation();
  const [deleteType, { isLoading: deleting }] = useDeleteCustomerTypeMutation();

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({
      name: item.name,
      colorCode: item.colorCode ?? PRESET_COLORS[0].hex,
      isDefault: item.isDefault ?? false,
      sortOrder: item.sortOrder ?? 0,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Type name is required'); return; }
    try {
      if (editItem) {
        await updateType({ id: editItem.id, data: form }).unwrap();
        toast.success('Customer type updated');
      } else {
        await createType(form).unwrap();
        toast.success('Customer type created');
      }
      setShowModal(false);
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Failed to save');
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await deleteType(deleteItem.id).unwrap();
      toast.success('Customer type deleted');
      setDeleteItem(null);
    } catch (err: any) {
      toast.error(err?.data?.message ?? 'Failed to delete');
    }
  };

  return (
    <div>
      <PageHeader
        title="Customer Types"
        subtitle="Manage customer categories for your business"
        breadcrumbs={[
          { label: 'Home', path: '/admin' },
          { label: 'Customers', path: '/admin/sales/customers' },
          { label: 'Customer Types' },
        ]}
        actions={
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] transition-colors">
            <Plus className="h-4 w-4" /> Add Type
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Types list ── */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-[#DBDFE9] rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#DBDFE9] flex items-center justify-between">
              <h3 className="font-semibold text-[#26272F] text-sm flex items-center gap-2">
                <Tag className="h-4 w-4 text-[#ff6d29]" /> All Customer Types
              </h3>
              <span className="text-xs text-gray-400">{types.length} types</span>
            </div>

            {isLoading ? (
              <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#ff6d29]" /></div>
            ) : types.length === 0 ? (
              <div className="py-12 text-center">
                <Tag className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No customer types yet</p>
                <button onClick={openAdd} className="mt-3 text-sm text-[#ff6d29] hover:underline">+ Create your first type</button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {types.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                    <GripVertical className="h-4 w-4 text-gray-300 flex-shrink-0" />
                    <TypeBadge name={item.name} colorCode={item.colorCode} />
                    {item.isDefault && (
                      <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> Default
                      </span>
                    )}
                    <span className="ml-auto text-xs text-gray-400">Order: {item.sortOrder}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(item)}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleteItem(item)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Info panel ── */}
        <div className="space-y-4">
          <div className="bg-white border border-[#DBDFE9] rounded-xl p-5">
            <h4 className="font-semibold text-[#26272F] text-sm mb-3">How it works</h4>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-orange-100 text-[#ff6d29] text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">1</span>
                Create types like <strong>Regular</strong>, <strong>Party</strong>, <strong>Wholesale</strong>, etc.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-orange-100 text-[#ff6d29] text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">2</span>
                Pick a color for each type — shown as badges in the customer list.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-orange-100 text-[#ff6d29] text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">3</span>
                Mark one type as <strong>Default</strong> to pre-select it when adding a customer.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-orange-100 text-[#ff6d29] text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">4</span>
                Filter customers by type from the customer list.
              </li>
            </ul>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-700">
            <p className="font-medium mb-1">Note</p>
            <p>You cannot delete a type if any customers are assigned to it. Reassign those customers first.</p>
          </div>
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-[#26272F] mb-5">
              {editItem ? 'Edit Customer Type' : 'Add Customer Type'}
            </h2>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Regular, Party, Wholesale…"
                  className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:border-[#ff6d29]"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Badge Color</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setForm({ ...form, colorCode: c.hex })}
                      title={c.name}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${form.colorCode === c.hex ? 'border-gray-800 scale-110' : 'border-transparent hover:scale-105'}`}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.colorCode}
                    onChange={(e) => setForm({ ...form, colorCode: e.target.value })}
                    className="w-10 h-9 border border-[#DBDFE9] rounded cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={form.colorCode}
                    onChange={(e) => setForm({ ...form, colorCode: e.target.value })}
                    placeholder="#3B82F6"
                    className="flex-1 px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm font-mono focus:outline-none focus:border-[#ff6d29]"
                  />
                </div>
                {/* Preview */}
                <div className="mt-2">
                  <TypeBadge name={form.name || 'Preview'} colorCode={form.colorCode} />
                </div>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                <input
                  type="number"
                  min="0"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                  className="w-24 px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:border-[#ff6d29]"
                />
                <p className="text-xs text-gray-400 mt-1">Lower number appears first</p>
              </div>

              {/* Default */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setForm({ ...form, isDefault: !form.isDefault })}
                  className={`w-10 h-5 rounded-full transition-colors relative ${form.isDefault ? 'bg-[#ff6d29]' : 'bg-gray-200'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isDefault ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm text-gray-700">Set as default type</span>
                {form.isDefault && <Star className="h-4 w-4 text-amber-500 fill-amber-400" />}
              </label>
            </div>

            <div className="flex gap-3 mt-6 justify-end">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSave} disabled={creating || updating}
                className="px-4 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] disabled:opacity-60 flex items-center gap-2">
                {(creating || updating) && <Loader2 className="h-4 w-4 animate-spin" />}
                {editItem ? 'Update' : 'Create Type'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Modal ── */}
      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Delete Customer Type</h3>
            <p className="text-sm text-gray-500 mb-6">
              Delete <span className="font-medium">"{deleteItem.name}"</span>?
              This cannot be undone and will fail if customers are assigned to this type.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteItem(null)}
                className="px-4 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={deleting}
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-60 flex items-center gap-2">
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerTypeSettings;
