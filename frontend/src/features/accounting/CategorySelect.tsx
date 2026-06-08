import { useState } from 'react';
import { Plus, Loader2, Tag, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  useGetAccountingCategoriesQuery,
  useCreateAccountingCategoryMutation,
} from './accountingApi';

// ─── Color palette ────────────────────────────────────────────────────────────
const PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

// ─── Tiny badge using inline style for dynamic colors ─────────────────────────
export const CategoryBadge = ({ name, color }: { name?: string; color?: string }) => {
  if (!name) return <span className="text-gray-400">—</span>;
  const bg = color ? `${color}18` : '#f3f4f6';
  const text = color ?? '#374151';
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: bg, color: text, border: `1px solid ${color ?? '#e5e7eb'}` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: text }} />
      {name}
    </span>
  );
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface CategorySelectProps {
  type: 'income' | 'expense';
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

// ─── Main component ───────────────────────────────────────────────────────────
const CategorySelect = ({ type, value, onChange, placeholder = 'Select category' }: CategorySelectProps) => {
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PALETTE[0]);

  const { data: categories = [], isLoading } = useGetAccountingCategoriesQuery({ type });
  const [createCategory, { isLoading: creating }] = useCreateAccountingCategoryMutation();

  const handleCreate = async () => {
    if (!newName.trim()) { toast.error('Category name is required'); return; }
    try {
      const created: any = await createCategory({ name: newName.trim(), type, color: newColor }).unwrap();
      onChange(created.name);
      setNewName('');
      setShowCreate(false);
      toast.success(`Category "${created.name}" created`);
    } catch (e: any) {
      toast.error(e?.data?.message ?? 'Failed to create category');
    }
  };

  const selected = (categories as any[]).find((c) => c.name === value);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full pl-3 pr-8 py-2.5 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] appearance-none bg-white"
          >
            <option value="">{isLoading ? 'Loading…' : placeholder}</option>
            {(categories as any[]).map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
          {selected && (
            <span
              className="absolute right-8 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full"
              style={{ backgroundColor: selected.color ?? '#9ca3af' }}
            />
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className={`flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
            showCreate
              ? 'bg-orange-50 text-[#ff6d29] border-[#ff6d29]'
              : 'bg-gray-50 text-gray-500 border-[#DBDFE9] hover:border-gray-300'
          }`}
          title="Create new category"
        >
          {showCreate ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showCreate ? 'Cancel' : 'New'}
        </button>
      </div>

      {showCreate && (
        <div className="border border-[#DBDFE9] rounded-xl p-3 bg-gray-50 space-y-3">
          <p className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-[#ff6d29]" /> New {type} category
          </p>
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowCreate(false); }}
            placeholder="Category name"
            className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
          />
          <div>
            <p className="text-xs text-gray-500 mb-1.5">Pick a color</p>
            <div className="flex flex-wrap gap-2">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewColor(c)}
                  className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
                    newColor === c ? 'border-gray-800 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            className="w-full py-2 bg-[#ff6d29] text-white rounded-lg text-xs font-medium hover:bg-[#e65a1f] disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            {creating ? 'Creating…' : 'Create Category'}
          </button>
        </div>
      )}
    </div>
  );
};

export default CategorySelect;
