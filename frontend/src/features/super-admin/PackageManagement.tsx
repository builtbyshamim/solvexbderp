import { useState } from 'react';
import {
  Package, Plus, Edit2, Trash2, ToggleLeft, ToggleRight,
  Star, Users, ShoppingBag, Warehouse, Clock, CheckCircle2,
  X, Save, AlertCircle, Crown, Building2, Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { MOCK_PACKAGES, yearlyDiscount, monthlyEquivalent } from '../../data/mockPackages';
import type { Package as PkgType } from '../../redux/api/packagesApi';

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => n === -1 ? 'Unlimited' : n.toLocaleString();
const ICONS: Record<string, React.ElementType> = {
  Starter: Zap, Pro: Crown, Enterprise: Building2,
};

// ─── Edit / Create modal ──────────────────────────────────────────────────────
const PKG_DEFAULTS: Omit<PkgType, 'id'> = {
  name: '',
  badge: '',
  highlight: false,
  isEnterprise: false,
  isActive: true,
  monthlyPrice: 0,
  yearlyPrice: 0,
  trialDays: 15,
  maxUsers: 3,
  maxProducts: 500,
  maxWarehouses: 1,
  features: [],
  sortOrder: 99,
};

type FormPkg = Omit<PkgType, 'id'> & { id?: string };

function PackageModal({
  initial,
  onClose,
  onSave,
}: {
  initial: FormPkg | null;
  onClose: () => void;
  onSave: (pkg: FormPkg) => void;
}) {
  const [form, setForm] = useState<FormPkg>(initial ?? { ...PKG_DEFAULTS });
  const [featureInput, setFeatureInput] = useState('');

  const set = (key: keyof FormPkg, value: any) =>
    setForm((p) => ({ ...p, [key]: value }));

  const addFeature = () => {
    const f = featureInput.trim();
    if (!f) return;
    setForm((p) => ({ ...p, features: [...p.features, f] }));
    setFeatureInput('');
  };

  const removeFeature = (i: number) =>
    setForm((p) => ({ ...p, features: p.features.filter((_, idx) => idx !== i) }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Package name is required'); return; }
    onSave(form);
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label}</label>
      {children}
    </div>
  );

  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/30 focus:border-[#ff6d29] transition-colors';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-[#26272F]">
            {initial?.id ? 'Edit Package' : 'Create Package'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Package Name *">
              <input value={form.name} onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Starter" className={inputCls} />
            </Field>
            <Field label="Badge (optional)">
              <input value={form.badge ?? ''} onChange={(e) => set('badge', e.target.value)}
                placeholder="e.g. Most Popular" className={inputCls} />
            </Field>
          </div>

          {/* Pricing */}
          <div className="p-4 bg-gray-50 rounded-xl space-y-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pricing</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Monthly Price (৳)">
                <input type="number" min={0} value={form.monthlyPrice}
                  onChange={(e) => set('monthlyPrice', Number(e.target.value))} className={inputCls} />
              </Field>
              <Field label="Yearly Price (৳)">
                <input type="number" min={0} value={form.yearlyPrice}
                  onChange={(e) => set('yearlyPrice', Number(e.target.value))} className={inputCls} />
              </Field>
            </div>
            {!form.isEnterprise && form.monthlyPrice > 0 && form.yearlyPrice > 0 && (
              <p className="text-xs text-green-600 font-medium">
                Yearly saves {yearlyDiscount({ ...form, id: '' } as PkgType)}% vs monthly
                (≈ ৳{monthlyEquivalent({ ...form, id: '' } as PkgType)}/mo equivalent)
              </p>
            )}
          </div>

          {/* Limits */}
          <div className="p-4 bg-gray-50 rounded-xl space-y-4">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Limits (-1 = Unlimited)</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Field label="Max Users">
                <input type="number" min={-1} value={form.maxUsers}
                  onChange={(e) => set('maxUsers', Number(e.target.value))} className={inputCls} />
              </Field>
              <Field label="Max Products">
                <input type="number" min={-1} value={form.maxProducts}
                  onChange={(e) => set('maxProducts', Number(e.target.value))} className={inputCls} />
              </Field>
              <Field label="Max Warehouses">
                <input type="number" min={-1} value={form.maxWarehouses}
                  onChange={(e) => set('maxWarehouses', Number(e.target.value))} className={inputCls} />
              </Field>
              <Field label="Trial Days">
                <input type="number" min={0} max={90} value={form.trialDays}
                  onChange={(e) => set('trialDays', Number(e.target.value))} className={inputCls} />
              </Field>
            </div>
          </div>

          {/* Features */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">Features</label>
            <div className="flex gap-2 mb-2">
              <input value={featureInput} onChange={(e) => setFeatureInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
                placeholder="Type a feature and press Enter or +"
                className={`${inputCls} flex-1`} />
              <button type="button" onClick={addFeature}
                className="px-3 py-2.5 bg-[#ff6d29] text-white rounded-lg hover:bg-orange-600 transition-colors">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {form.features.length > 0 && (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {form.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                    <span className="flex-1 text-gray-600">{f}</span>
                    <button type="button" onClick={() => removeFeature(i)} className="text-gray-300 hover:text-red-400">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Flags */}
          <div className="flex flex-wrap gap-4">
            {[
              { key: 'highlight', label: 'Mark as highlighted' },
              { key: 'isEnterprise', label: 'Enterprise (no fixed price)' },
              { key: 'isActive', label: 'Active (visible to users)' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={!!form[key as keyof FormPkg]}
                  onChange={(e) => set(key as keyof FormPkg, e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-[#ff6d29] focus:ring-[#ff6d29]" />
                <span className="text-sm text-gray-600">{label}</span>
              </label>
            ))}
          </div>

          {/* Footer */}
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit"
              className="flex-1 py-2.5 bg-[#ff6d29] hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
              <Save className="h-4 w-4" />
              {initial?.id ? 'Save Changes' : 'Create Package'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Delete confirm ───────────────────────────────────────────────────────────
function DeleteConfirm({ name, onConfirm, onClose }: { name: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="h-5 w-5 text-red-500" />
        </div>
        <h3 className="font-bold text-[#26272F] mb-1">Delete "{name}"?</h3>
        <p className="text-sm text-gray-500 mb-5">
          This package will be removed from the pricing page. Existing subscribers keep their plan.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-semibold">Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const PackageManagement = () => {
  const [packages, setPackages] = useState<PkgType[]>(MOCK_PACKAGES);
  const [editPkg, setEditPkg] = useState<FormPkg | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deletePkg, setDeletePkg] = useState<PkgType | null>(null);

  const handleSave = (form: FormPkg) => {
    if (form.id) {
      setPackages((p) => p.map((x) => (x.id === form.id ? { ...x, ...form, id: x.id } : x)));
      toast.success('Package updated!');
    } else {
      const newPkg: PkgType = { ...form, id: Date.now().toString() };
      setPackages((p) => [...p, newPkg]);
      toast.success('Package created!');
    }
    setEditPkg(null);
    setShowCreate(false);
  };

  const toggleActive = (pkg: PkgType) => {
    setPackages((p) => p.map((x) => x.id === pkg.id ? { ...x, isActive: !x.isActive } : x));
    toast.success(`"${pkg.name}" ${pkg.isActive ? 'deactivated' : 'activated'}`);
  };

  const handleDelete = () => {
    if (!deletePkg) return;
    setPackages((p) => p.filter((x) => x.id !== deletePkg.id));
    toast.success(`"${deletePkg.name}" deleted`);
    setDeletePkg(null);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#26272F]">Package Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Control pricing, trial days, limits, and features shown to customers
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#ff6d29] hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" /> New Package
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">
        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
        Changes here update the pricing page and subscription screen immediately. Existing subscribers keep their current plan until they upgrade or renew.
      </div>

      {/* Package cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {packages.map((pkg) => {
          const Icon = ICONS[pkg.name] ?? Package;
          const discount = yearlyDiscount(pkg);

          return (
            <div
              key={pkg.id}
              className={`bg-white border-2 rounded-2xl overflow-hidden flex flex-col transition-all ${
                pkg.isActive ? 'border-[#DBDFE9] shadow-sm' : 'border-gray-200 opacity-60'
              } ${pkg.highlight ? 'ring-2 ring-orange-400/30' : ''}`}
            >
              {/* Card header */}
              <div className={`px-5 py-4 flex items-center justify-between ${pkg.highlight ? 'bg-[#26272F]' : 'bg-gray-50'} border-b border-gray-100`}>
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-lg ${pkg.highlight ? 'bg-orange-500/20' : 'bg-white border border-gray-200'}`}>
                    <Icon className={`h-4 w-4 ${pkg.highlight ? 'text-orange-400' : 'text-[#ff6d29]'}`} />
                  </div>
                  <div>
                    <p className={`font-bold text-sm ${pkg.highlight ? 'text-white' : 'text-[#26272F]'}`}>{pkg.name}</p>
                    {pkg.badge && (
                      <span className="text-[10px] font-semibold text-orange-500">{pkg.badge}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    pkg.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {pkg.isActive ? 'Active' : 'Hidden'}
                  </span>
                </div>
              </div>

              <div className="p-5 flex-1 space-y-4">
                {/* Pricing */}
                {pkg.isEnterprise ? (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black text-[#26272F]">Custom</span>
                    <span className="text-xs text-gray-400">pricing</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div>
                      <p className="text-xs text-gray-400">Monthly</p>
                      <p className="text-xl font-black text-[#26272F]">৳{pkg.monthlyPrice.toLocaleString()}</p>
                    </div>
                    <div className="text-gray-300">|</div>
                    <div>
                      <p className="text-xs text-gray-400">Yearly</p>
                      <p className="text-xl font-black text-[#26272F]">৳{pkg.yearlyPrice.toLocaleString()}</p>
                    </div>
                    {discount > 0 && (
                      <span className="self-end mb-0.5 text-xs font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                        -{discount}% yearly
                      </span>
                    )}
                  </div>
                )}

                {/* Limits grid */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { icon: Users, label: 'Users', val: fmt(pkg.maxUsers) },
                    { icon: ShoppingBag, label: 'Products', val: fmt(pkg.maxProducts) },
                    { icon: Warehouse, label: 'Warehouses', val: fmt(pkg.maxWarehouses) },
                    { icon: Clock, label: 'Trial Days', val: `${pkg.trialDays} days` },
                  ].map(({ icon: Icon2, label, val }) => (
                    <div key={label} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                      <Icon2 className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] text-gray-400">{label}</p>
                        <p className="text-xs font-semibold text-[#26272F] truncate">{val}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Features preview */}
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                    Features ({pkg.features.length})
                  </p>
                  <ul className="space-y-1">
                    {pkg.features.slice(0, 4).map((f) => (
                      <li key={f} className="flex items-center gap-1.5 text-xs text-gray-500">
                        <CheckCircle2 className="h-3 w-3 text-green-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                    {pkg.features.length > 4 && (
                      <li className="text-xs text-gray-400 pl-4.5">+{pkg.features.length - 4} more features</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Actions */}
              <div className="px-5 pb-5 flex gap-2">
                <button
                  onClick={() => setEditPkg({ ...pkg })}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => toggleActive(pkg)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                    pkg.isActive
                      ? 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                      : 'border border-green-200 text-green-600 hover:bg-green-50'
                  }`}
                >
                  {pkg.isActive
                    ? <><ToggleLeft className="h-3.5 w-3.5" /> Deactivate</>
                    : <><ToggleRight className="h-3.5 w-3.5" /> Activate</>}
                </button>
                <button
                  onClick={() => setDeletePkg(pkg)}
                  className="p-2 border border-red-100 rounded-lg text-red-400 hover:bg-red-50 hover:border-red-200 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Add card */}
        <button
          onClick={() => setShowCreate(true)}
          className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 hover:border-[#ff6d29] hover:bg-orange-50/30 transition-all group min-h-[300px]"
        >
          <div className="h-12 w-12 rounded-xl bg-gray-100 group-hover:bg-orange-100 flex items-center justify-center transition-colors">
            <Plus className="h-6 w-6 text-gray-400 group-hover:text-[#ff6d29]" />
          </div>
          <p className="text-sm font-medium text-gray-400 group-hover:text-[#ff6d29]">Add New Package</p>
        </button>
      </div>

      {/* Modals */}
      {(editPkg || showCreate) && (
        <PackageModal
          initial={editPkg}
          onClose={() => { setEditPkg(null); setShowCreate(false); }}
          onSave={handleSave}
        />
      )}
      {deletePkg && (
        <DeleteConfirm
          name={deletePkg.name}
          onConfirm={handleDelete}
          onClose={() => setDeletePkg(null)}
        />
      )}
    </div>
  );
};

export default PackageManagement;
