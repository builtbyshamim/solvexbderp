import { useState, useEffect } from 'react';
import { Upload, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { useUpdateBrandMutation } from './brandApi';

const EditBrand = ({ brand, onClose }: { brand: any; onClose: () => void }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: brand?.name || '',
      description: brand?.description || '',
      isActive: brand?.isActive == 'true' || brand?.isActive || false,
    },
  });
  const [logo, setLogo] = useState<{ file: File | null; preview: string } | null>(
    brand?.logo ? { file: null, preview: brand.logo } : null,
  );
  const [updateBrand, { isLoading }] = useUpdateBrandMutation();

  useEffect(() => {
    if (brand?.logo) setLogo({ file: null, preview: brand.logo });
  }, [brand]);

  const onSubmit = async (data: any) => {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    formData.append('isActive', data.isActive ? 'true' : 'false');
    if (logo?.file) formData.append('logo', logo.file);

    try {
      await updateBrand({ id: brand.id, data: formData }).unwrap();
      toast.success('Brand updated');
      onClose();
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update brand');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Brand Name <span className="text-red-500">*</span>
        </label>
        <input
          {...register('name', { required: 'Name is required' })}
          placeholder="e.g. Samsung"
          className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29]"
        />
        {errors.name && (
          <p className="text-red-500 text-xs mt-1">{errors.name.message as string}</p>
        )}
      </div>

      {/* Logo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
          <input
            type="file"
            id="logo-upload-edit"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setLogo({ file, preview: URL.createObjectURL(file) });
            }}
          />
          {logo ? (
            <div className="relative inline-block">
              <img
                src={logo.preview}
                alt="Logo"
                className="h-20 w-20 object-cover rounded-lg mx-auto"
              />
              <button
                type="button"
                onClick={() => setLogo(null)}
                className="absolute -top-1.5 -right-1.5 p-0.5 bg-red-500 text-white rounded-full"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <label
              htmlFor="logo-upload-edit"
              className="cursor-pointer flex flex-col items-center gap-1 text-gray-400"
            >
              <Upload size={20} />
              <span className="text-xs">Click to upload</span>
            </label>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          {...register('description')}
          rows={2}
          placeholder="Short brand description (optional)"
          className="w-full px-3 py-2 border border-[#DBDFE9] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#ff6d29]/20 focus:border-[#ff6d29] resize-none"
        />
      </div>

      {/* Status */}
      <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
        <span className="text-sm font-medium text-gray-700">Active Status</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" {...register('isActive')} className="sr-only peer" />
          <div className="w-9 h-5 bg-gray-200 peer-checked:bg-[#ff6d29] rounded-full transition-colors peer-focus:ring-2 peer-focus:ring-[#ff6d29]/20" />
          <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
        </label>
      </div>

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 py-2 border border-[#DBDFE9] text-gray-600 rounded-lg text-sm hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 py-2 bg-[#ff6d29] text-white rounded-lg text-sm font-medium hover:bg-[#e65a1f] disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isLoading && (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          <Save size={14} /> Update Brand
        </button>
      </div>
    </form>
  );
};

export default EditBrand;
