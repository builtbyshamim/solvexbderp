import { useState, useEffect } from "react";
import { FiSave, FiUpload, FiX } from "react-icons/fi";

import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import InputString from "../../../components/ui/InputString";
import InputTextarea from "../../../components/ui/InputTextarea";
import ToggleSwitch from "../../../components/ui/toggle/ToggleSwitch";
import { useUpdateBrandMutation } from "./brandApi";

const EditBrand = ({ onClose, brand }: any) => {
  const {
    register,
    formState: { errors },
    handleSubmit,
    reset,
  } = useForm({
    defaultValues: {
      name: brand?.name || "",
      description: brand?.description || "",
      meta_description: brand?.seoMeta?.description || "",
      meta_title: brand?.seoMeta?.meta_title || "",
      keywords: brand?.seoMeta?.keywords
        ? brand.seoMeta.keywords.join(", ")
        : "",
    },
  });

  const [images, setImages] = useState<any>(null);
  const [updateBrand, { isLoading }] = useUpdateBrandMutation();

  // show old image preview in edit mode
  useEffect(() => {
    if (brand?.logo) {
      setImages({
        file: null,
        preview: brand.logo,
      });
    }
  }, [brand]);

  const onSubmit = async (data: any) => {
    try {
      const formData = new FormData();

      if (data.keywords) {
        data.keywords = data.keywords
          .split(",")
          .map((k: string) => k.trim())
          .filter(Boolean);
      }

      console.log("Processed form data:", data);
      Object.keys(data).forEach((key) => {
        const value = data[key];
        if (value === undefined || value === null) return;

        if (key === "keywords" && Array.isArray(value)) {
          value.forEach((k: string) => {
            formData.append("keywords", k);
          });
        } else if (key === "status") {
          formData.append("status", value == true ? "active" : "inactive");
        } else {
          formData.append(key, value);
        }
      });

      if (images.file) {
        formData.append("logo", images.file);
      }
      console.log(images.file, "images.file");

      const result = await updateBrand({
        id: brand.id,
        data: formData,
      }).unwrap();

      if (result?.success) {
        toast.success("Brand updated successfully!");
        reset();
        onClose();
      } else {
        toast.error(result?.message || "Update failed");
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to update brand");
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

      {/* Name */}
      <InputString
        placeholder="Enter name"
        name="name"
        label="Brand Name"
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
          name="meta_title"
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
          name="meta_description"
          label="Meta Description"
          required={false}
          register={register}
          rows={2}
          errors={errors}
        />
      </div>
      <div>
        <InputString
          placeholder="Enter keywords here... "
          name="keywords"
          label="Keywords"
          required={false}
          register={register}
          errors={errors}
        />
      </div>
      <ToggleSwitch
        name="status"
        label="Brand Status"
        register={register}
        errors={errors}
        defaultValue={true}
        onToggle={(status) => {
          console.log("Status changed to:", status ? "Active" : "Inactive");
        }}
        helperText="Enable to make this Brand visible"
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
            Update Brand
          </>
        )}
      </button>
    </form>
  );
};

export default EditBrand;
