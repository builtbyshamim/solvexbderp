import { useState, useEffect } from "react";
import { FiSave, FiUpload, FiX } from "react-icons/fi";
import InputString from "../../../../components/ui/InputString";
import InputTextarea from "../../../../components/ui/InputTextarea";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import {
  useUpdateCategoryMutation,
  useGetAllCategoryQuery,
} from "../categoryApi";
import SelectAndSearch from "../../../../components/ui/SelectAndSearch";
import ToggleSwitch from "../../../../components/ui/toggle/ToggleSwitch";

const EditCategory = ({ onClose, category }: any) => {
  const {
    register,
    formState: { errors },
    clearErrors,
    setValue,
    handleSubmit,
    reset,
    trigger,
  } = useForm({
    defaultValues: {
      isActive: category?.isActive ?? true,
      name: category?.name || "",
      description: category?.description || "",
      metaDescription: category?.metaDescription || "",
      metaTitle: category?.metaTitle || "",
      parentId: category?.parentId || "",
    },
  });

  const [images, setImages] = useState<any>(null);
  const { data: categoryData } = useGetAllCategoryQuery({ search: "" });
  const [updateCategory, { isLoading }] = useUpdateCategoryMutation();

  // show old image preview in edit mode
  useEffect(() => {
    if (category?.image) {
      setImages({
        file: null,
        preview: category.image,
      });
    }
  }, [category]);

  const onSubmit = async (data: any) => {
    try {
      const formData = new FormData();

      // ✅ append fields safely
      Object.keys(data).forEach((key) => {
        const value = data[key];

        if (value === undefined || value === null || value === "") return;

        if (typeof value === "boolean") {
          formData.append(key, value ? "true" : "false");
        } else {
          formData.append(key, value);
        }
      });

      // ✅ only append image if new file selected
      if (images?.file) {
        formData.append("image", images.file);
      }

      const result = await updateCategory({
        id: category.id,
        data: formData,
      }).unwrap();

      if (result?.success) {
        toast.success("Category updated successfully!");
        reset();
        onClose();
      } else {
        toast.error(result?.message || "Update failed");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to update category");
    }
  };

  const handleImageUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setImages({ file, preview });
  };

  const removeImage = () => {
    setImages(null);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Parent */}
      <SelectAndSearch
        clearErrors={clearErrors}
        trigger={trigger}
        setValue={setValue}
        register={register}
        required={false}
        name="parentId"
        errors={errors}
        label="Parent Category"
        placeholder="Select parent"
        options={categoryData?.data?.data?.map((item: any) => ({
          label: item?.name,
          value: item?.id,
        }))}
      />

      {/* Name */}
      <InputString
        placeholder="Enter name"
        name="name"
        label="Category Name"
        register={register}
        errors={errors}
      />

      {/* Image */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
        <input
          type="file"
          id="image-upload"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        {images ? (
          <div className="relative group">
            <img
              src={images.preview}
              className="w-full max-h-62.5 object-cover rounded-md"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
            >
              <FiX size={12} />
            </button>
          </div>
        ) : (
          <label htmlFor="image-upload" className="cursor-pointer">
            <div className="flex flex-col items-center">
              <FiUpload className="text-3xl text-gray-400 mb-2" />
              <p className="text-sm font-medium text-gray-700">
                Click to upload
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, GIF up to 10MB
              </p>
              <p className="text-xs text-gray-400 mt-1">(Max 10 images)</p>
            </div>
            Click to upload
          </label>
        )}
      </div>

      {/* Description */}
      <InputTextarea
        name="description"
        required={false}
        label="Description"
        register={register}
        errors={errors}
        rows={2}
      />

      <InputTextarea
        name="metaTitle"
        required={false}
        label="Meta Title"
        register={register}
        errors={errors}
        rows={2}
      />

      <InputTextarea
        name="metaDescription"
        label="Meta Description"
        register={register}
        errors={errors}
        required={false}
        rows={2}
      />

      {/* Toggle */}
      <ToggleSwitch
        name="isActive"
        label="Category Status"
        register={register}
        errors={errors}
        defaultValue={category?.isActive ?? true}
        onToggle={(v) => setValue("isActive", v)}
        helperText="Enable to make this category visible"
      />

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="px-6 py-2.5 cursor-pointer bg-primary-500 text-white rounded-md hover:bg-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Updating...
          </>
        ) : (
          <>
            <FiSave className="mr-2" />
            Update Category
          </>
        )}
      </button>
    </form>
  );
};

export default EditCategory;
