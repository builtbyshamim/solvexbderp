import { useState } from "react";
import { FiSave, FiUpload, FiX } from "react-icons/fi";
import InputString from "../../../../components/ui/InputString";
import InputTextarea from "../../../../components/ui/InputTextarea";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import {
  useCreateCategoryMutation,
  useGetAllCategoryQuery,
} from "../categoryApi";
import SelectAndSearch from "../../../../components/ui/SelectAndSearch";
import ToggleSwitch from "../../../../components/ui/toggle/ToggleSwitch";
const AddCategory = ({ onClose }: any) => {
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
      isActive: true,
    },
  });
  const [images, setImages] = useState(null);
  const { data: categoryData } = useGetAllCategoryQuery({ search: "" });
  const [createCategory, { isLoading }] = useCreateCategoryMutation();
  const onSubmit = async (data: any) => {
    try {
      // Prepare form data
      const formData = new FormData();
      if (!images?.file) {
        toast.error("Image is requrid ");
        return;
      }

      // Append basic fields
      // Append basic fields
      Object.keys(data).forEach((key) => {
        const value = data[key];
        if (value === undefined || value === null) return;

        // ✅ Convert boolean to string for FormData, backend will parse it
        if (typeof value === "boolean") {
          formData.append(key, value ? "true" : "false");
        } else {
          formData.append(key, value);
        }
      });

      formData.append("image", images?.file);
      const result = await createCategory(formData).unwrap();
      if (result?.success) {
        toast.success("Category added successfully!");
        reset();
        onClose();
      } else {
        toast.error(result?.message || "Category added fail ");
      }
    } catch (error) {
      toast.error(error?.message || "Failed to add product. Please try again.");
    }
  };
  const handleImageUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const image = URL.createObjectURL(file);
    setImages({ file: file, preview: image });
  };
  const removeImage = () => {
    setImages(null);
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <div>
            <SelectAndSearch
              clearErrors={clearErrors}
              trigger={trigger}
              setValue={setValue}
              register={register}
              required={false}
              name="parentId"
              errors={errors}
              label="Parent Category"
              placeholder="Select an Parent"
              options={categoryData?.data?.data?.map((item: any) => ({
                label: item?.name,
                value: item?.id,
              }))}
              onChange={() => {}}
            />
          </div>

          {/* Product Name */}
          <InputString
            placeholder="Enter name"
            name="name"
            label="Category Name"
            register={register}
            errors={errors}
          />

          

          <div className="mt-2">
            {/* Image Upload Area */}
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
                    src={images?.preview}
                    alt="Preview"
                    className="w-full max-h-62.5 object-cover rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage()}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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
                    <p className="text-xs text-gray-400 mt-1">
                      (Max 10 images)
                    </p>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <InputTextarea
              placeholder="Enter description here... "
              name="description"
              label="Description"
              required={false}
              register={register}
              rows={2}
              errors={errors}
            />
          </div>
          <div>
            <InputTextarea
              placeholder="Enter Meta Title here... "
              name="metaTitle"
              label="Meta Title"
              required={false}
              register={register}
              rows={2}
              errors={errors}
            />
          </div>
          <div>
            <InputTextarea
              placeholder="Enter Meta Description here... "
              name="metaDescription"
              label="Meta Description"
              required={false}
              register={register}
              rows={2}
              errors={errors}
            />
          </div>
          <ToggleSwitch
            name="isActive"
            label="Category Status"
            register={register}
            errors={errors}
            defaultValue={true}
            onToggle={(isActive) => {
              console.log(
                "Status changed to:",
                isActive ? "Active" : "Inactive",
              );
            }}
            helperText="Enable to make this category visible"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 cursor-pointer bg-primary-500 text-white rounded-md hover:bg-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <FiSave className="mr-2" />
                Save Category
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCategory;
