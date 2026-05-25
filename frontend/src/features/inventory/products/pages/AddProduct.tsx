import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import {
  FiPlus,
  FiTrash2,
  FiSave,
  FiX,
  FiPackage,
  FiDollarSign,
  FiTag,
  FiLayers,
  FiInfo,
  FiGrid,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { BsBoxSeam } from "react-icons/bs";
import toast from "react-hot-toast";
import { useCreateProductMutation } from "../productApi";
import { useNavigate } from "react-router-dom";
import SelectAndSearch from "../../../../components/ui/SelectAndSearch";
import { useGetAllCategoryQuery } from "../../category/categoryApi";
import { useGetAllBrandQuery } from "../../brand/brandApi";
import JoditTextEditor from "../../../../components/ui/editor/JoditTextEditor";

// ─── Types (matching DTO) ────────────────────────────────────
type ProductType = "physical" | "digital" | "service";

interface OptionValue {
  value: string;
  colorHex?: string;
  position?: number;
}

interface ProductOption {
  name: string;
  values: OptionValue[];
  position?: number;
}

interface BulkPricingTier {
  minQty: number;
  maxQty?: number;
  price: number;
  discountPercent?: number;
}

interface VariantImage {
  url: string;
  altText?: string;
  sortOrder?: number;
}

interface Variant {
  sku?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  stock?: number;
  weightGrams?: number;
  dimensions?: { length: number; width: number; height: number };
  digitalFileUrl?: string;
  digitalFileName?: string;
  durationMinutes?: number;
  barcode?: string;
  hsCode?: string;
  optionValues: string[];
  images?: VariantImage[];
  bulkPricingTiers?: BulkPricingTier[];
}

interface FormValues {
  name: string;
  description?: string;
  type: ProductType;
  categoryId?: string;
  brandId?: string;
  moq?: number;
  seoMeta?: { title?: string; description?: string; keywords?: string };
  hasVariants: boolean;
  basePrice?: number;
  compareAtPrice?: number;
  baseStock?: number;
  options?: ProductOption[];
  variants?: Variant[];
  bulkPricingTiers?: BulkPricingTier[];
}

// ─── Sub-components ──────────────────────────────────────────

const SectionCard = ({
  icon: Icon,
  iconColor,
  title,
  children,
  collapsible = false,
}: any) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 ">
      <div
        className={`flex items-center justify-between px-6 py-4 border-b border-gray-100 ${collapsible ? "cursor-pointer select-none" : ""}`}
        onClick={collapsible ? () => setOpen(!open) : undefined}
      >
        <div className="flex items-center gap-2">
          <span className={`p-1.5 rounded-lg ${iconColor}`}>
            <Icon size={16} className="text-white" />
          </span>
          <h2 className="font-semibold text-gray-800 text-sm tracking-wide">
            {title}
          </h2>
        </div>
        {collapsible &&
          (open ? (
            <FiChevronUp size={16} className="text-gray-400" />
          ) : (
            <FiChevronDown size={16} className="text-gray-400" />
          ))}
      </div>
      {(!collapsible || open) && <div className="p-6">{children}</div>}
    </div>
  );
};

const FormField = ({ label, required, error, children }: any) => (
  <div>
    {label && (
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
    )}
    {children}
    {error && <p className="text-rose-500 text-xs mt-1">{error}</p>}
  </div>
);

const inputCls = (err?: any) =>
  `w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${err ? "border-rose-400 bg-rose-50" : "border-gray-200 bg-gray-50 hover:border-gray-300"}`;

const btnSecondary =
  "px-3 py-1.5 text-xs font-medium border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 flex items-center gap-1 transition-all";
const btnDanger =
  "p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all";

// ─── Simple Price Preview ────────────────────────────────────
const SimplePricePreview = ({ watch }: { watch: any }) => {
  const price = parseFloat(watch("basePrice")) || 0;
  const compareAt = parseFloat(watch("compareAtPrice")) || 0;
  const hasDiscount = compareAt > 0 && compareAt > price;
  const discountPct = hasDiscount
    ? Math.round(((compareAt - price) / compareAt) * 100)
    : 0;

  if (price === 0) return null;

  return (
    <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Preview
      </p>
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold text-gray-900">
          ৳{price.toFixed(2)}
        </span>
        {hasDiscount && (
          <>
            <span className="text-base text-gray-400 line-through">
              ৳{compareAt.toFixed(2)}
            </span>
            <span className="px-2 py-0.5 bg-rose-500 text-white text-xs font-bold rounded-full">
              -{discountPct}%
            </span>
          </>
        )}
      </div>
      {hasDiscount && (
        <p className="text-xs text-emerald-600 mt-1.5 font-medium">
          Customer saves ৳{(compareAt - price).toFixed(2)}
        </p>
      )}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────
const AddProduct = () => {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    clearErrors,
    trigger,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      type: "physical",
      hasVariants: false,
      options: [],
      variants: [],
      bulkPricingTiers: [],
    },
  });

  const hasVariants = watch("hasVariants");
  const productType = watch("type");
  const basePrice = watch("basePrice");
  const [description, setDescription] = useState("");
  const costPrice = watch("variants.0.costPrice");
  const navigate = useNavigate();
  const { data: categoryData } = useGetAllCategoryQuery({ search: "" });
  const { data: brandData } = useGetAllBrandQuery({ search: "" });
  // Field arrays
  const {
    fields: optionFields,
    append: addOption,
    remove: removeOption,
  } = useFieldArray({ control, name: "options" });
  const {
    fields: variantFields,
    append: addVariant,
    remove: removeVariant,
  } = useFieldArray({ control, name: "variants" });
  const {
    fields: bulkFields,
    append: addBulkTier,
    remove: removeBulkTier,
  } = useFieldArray({ control, name: "bulkPricingTiers" });

  // Option values management (nested)
  const addOptionValue = (optionIndex: number) => {
    const current = watch(`options.${optionIndex}.values`) || [];
    setValue(`options.${optionIndex}.values`, [
      ...current,
      { value: "", position: current.length },
    ]);
  };

  const removeOptionValue = (optionIndex: number, valueIndex: number) => {
    const current = watch(`options.${optionIndex}.values`) || [];
    setValue(
      `options.${optionIndex}.values`,
      current.filter((_, i) => i !== valueIndex),
    );
  };
  const [createProduct, { isLoading }] = useCreateProductMutation();
  const onSubmit = async (data: FormValues) => {
    try {
      // Parse keywords string to array
      if (data.seoMeta?.keywords) {
        (data as any).seoMeta.keywords = (data.seoMeta.keywords as any)
          .split(",")
          .map((k: string) => k.trim())
          .filter(Boolean);
      }
      data.description = description;
      const res = await createProduct(data).unwrap();
      if (res.success) {
        toast.success(res.message || "Product created successfully!");
        reset();
        navigate(`/admin/manage-products/media/${res.data.id}`);
      } else {
        toast.error(res.message || "Failed to create product.");
      }
    } catch (error: any) {
      console.error("API error:", error);
      toast.error(error?.message || "Failed to create product.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      <div className="">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-blue-600 rounded-xl">
                <BsBoxSeam className="text-white" size={20} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Add New Product
              </h1>
            </div>
            <p className="text-sm text-gray-500 ml-14">
              Fill in all required fields to publish your product
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => reset()}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-white transition-all"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              className="px-5 py-2 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-all flex items-center gap-2"
            >
              <FiSave size={14} /> Save Draft
            </button>
            <button
              type="submit"
              form="product-form"
              disabled={isLoading}
              className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm shadow-blue-200 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                  Publishing...
                </>
              ) : (
                <>
                  <FiPackage size={14} /> Publish Product
                </>
              )}
            </button>
          </div>
        </div>

        <form id="product-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── LEFT COLUMN ── */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <SectionCard
                icon={FiInfo}
                iconColor="bg-blue-500"
                title="Basic Information"
              >
                <div className="space-y-4">
                  <FormField
                    label="Product Name"
                    required
                    error={errors.name?.message}
                  >
                    <input
                      {...register("name", {
                        required: "Product name is required",
                        minLength: { value: 3, message: "Min 3 characters" },
                        maxLength: {
                          value: 255,
                          message: "Max 255 characters",
                        },
                      })}
                      className={inputCls(errors.name)}
                      placeholder="e.g. Premium Cotton T-Shirt"
                    />
                  </FormField>

                  <div>
                    <JoditTextEditor
                      label={"Description"}
                      required={true}
                      content={description}
                      setContent={setDescription}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <SelectAndSearch
                        clearErrors={clearErrors}
                        trigger={trigger}
                        setValue={setValue}
                        register={register}
                        required={true}
                        name="categoryId"
                        errors={errors}
                        label="Category"
                        placeholder="Select a Category"
                        options={categoryData?.data?.data?.map((item: any) => ({
                          label: item?.name,
                          value: item?.id,
                        }))}
                        onChange={() => {}}
                      />
                    </div>
                    <div>
                      <SelectAndSearch
                        clearErrors={clearErrors}
                        trigger={trigger}
                        setValue={setValue}
                        register={register}
                        required={true}
                        name="brandId"
                        errors={errors}
                        label="Brand"
                        placeholder="Select a Brand"
                        options={brandData?.data?.data?.map((item: any) => ({
                          label: item?.name,
                          value: item?.id,
                        }))}
                        onChange={() => {}}
                      />
                    </div>
                  </div>

                  <FormField
                    label="Minimum Order Quantity (MOQ)"
                    error={(errors as any).moq?.message}
                  >
                    <input
                      type="number"
                      min={1}
                      {...register("moq", {
                        min: { value: 1, message: "Min 1" },
                        valueAsNumber: true,
                      })}
                      className={inputCls((errors as any).moq)}
                      placeholder="1"
                    />
                  </FormField>
                </div>
              </SectionCard>

              {/* Pricing */}
              <SectionCard
                icon={FiDollarSign}
                iconColor="bg-emerald-500"
                title="Pricing"
              >
                <div className="mb-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        {...register("hasVariants")}
                        className="sr-only"
                      />
                      <div
                        onClick={() => setValue("hasVariants", !hasVariants)}
                        className={`w-11 h-6 rounded-full transition-colors cursor-pointer ${hasVariants ? "bg-blue-500" : "bg-gray-200"}`}
                      >
                        <div
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${hasVariants ? "translate-x-5" : ""}`}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      This product has variants (size, color, etc.)
                    </span>
                  </label>
                </div>

                {!hasVariants && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      label="Base Price"
                      required
                      error={(errors as any).basePrice?.message}
                    >
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                          ৳
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          {...register("basePrice", {
                            required: !hasVariants && "Price is required",
                            min: 0,
                            valueAsNumber: true,
                          })}
                          className={`${inputCls((errors as any).basePrice)} pl-7`}
                          placeholder="0.00"
                        />
                      </div>
                    </FormField>
                    <FormField
                      label="Base Stock (null = unlimited)"
                      error={(errors as any).baseStock?.message}
                    >
                      <input
                        type="number"
                        min={0}
                        {...register("baseStock", {
                          min: 0,
                          valueAsNumber: true,
                        })}
                        className={inputCls((errors as any).baseStock)}
                        placeholder="0"
                      />
                    </FormField>
                  </div>
                )}

                {/* Simple Product Bulk Pricing OR Compare Price display */}
                {!hasVariants && (
                  <div className="mt-5">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Bulk Pricing Tiers
                      </span>
                      <button
                        type="button"
                        onClick={() => addBulkTier({ minQty: 1, price: 0 })}
                        className={btnSecondary}
                      >
                        <FiPlus size={12} /> Add Tier
                      </button>
                    </div>

                    {bulkFields.length === 0 ? (
                      /* No bulk tiers → show Compare At Price + Price preview */
                      <div className="space-y-4">
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                          <p className="text-xs text-amber-600 font-medium mb-3">
                            No bulk tiers — set a compare price to show a
                            discount badge.
                          </p>
                          <FormField label="Compare At Price (original / crossed-out price)">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                                ৳
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                min={0}
                                {...register("compareAtPrice", {
                                  valueAsNumber: true,
                                })}
                                className={`${inputCls()} pl-7`}
                                placeholder="0.00"
                              />
                            </div>
                          </FormField>
                        </div>

                        {/* Live price preview */}
                        <SimplePricePreview watch={watch} />
                      </div>
                    ) : (
                      /* Has bulk tiers → show tier table */
                      <div className="space-y-3">
                        {bulkFields.map((field, i) => (
                          <div
                            key={field.id}
                            className="grid grid-cols-5 gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100"
                          >
                            <FormField label="Min Qty">
                              <input
                                type="number"
                                min={1}
                                {...register(`bulkPricingTiers.${i}.minQty`, {
                                  valueAsNumber: true,
                                })}
                                className={inputCls()}
                                placeholder="10"
                              />
                            </FormField>
                            <FormField label="Max Qty">
                              <input
                                type="number"
                                min={1}
                                {...register(`bulkPricingTiers.${i}.maxQty`, {
                                  valueAsNumber: true,
                                })}
                                className={inputCls()}
                                placeholder="∞"
                              />
                            </FormField>
                            <FormField label="Price">
                              <input
                                type="number"
                                step="0.01"
                                min={0}
                                {...register(`bulkPricingTiers.${i}.price`, {
                                  valueAsNumber: true,
                                })}
                                className={inputCls()}
                                placeholder="0.00"
                              />
                            </FormField>
                            <FormField label="Discount %">
                              <input
                                type="number"
                                step="0.01"
                                min={0}
                                max={100}
                                {...register(
                                  `bulkPricingTiers.${i}.discountPercent`,
                                  { valueAsNumber: true },
                                )}
                                className={inputCls()}
                                placeholder="0"
                              />
                            </FormField>
                            <div className="flex items-end pb-0.5">
                              <button
                                type="button"
                                onClick={() => removeBulkTier(i)}
                                className={btnDanger}
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </SectionCard>

              {/* Options (only when hasVariants) */}
              {hasVariants && (
                <SectionCard
                  icon={FiGrid}
                  iconColor="bg-violet-500"
                  title="Product Options"
                >
                  <div className="space-y-4">
                    {optionFields.map((optField, optIdx) => {
                      const optionValues =
                        watch(`options.${optIdx}.values`) || [];
                      return (
                        <div
                          key={optField.id}
                          className="p-4 border border-gray-100 rounded-xl bg-gray-50/50"
                        >
                          <div className="flex items-start gap-3 mb-3">
                            <div className="flex-1 grid grid-cols-2 gap-3">
                              <FormField label="Option Name" required>
                                <input
                                  {...register(`options.${optIdx}.name`, {
                                    required: true,
                                  })}
                                  className={inputCls(
                                    errors.options?.[optIdx]?.name,
                                  )}
                                  placeholder="e.g. Color, Size"
                                />
                              </FormField>
                              <FormField label="Position">
                                <input
                                  type="number"
                                  min={0}
                                  {...register(`options.${optIdx}.position`, {
                                    valueAsNumber: true,
                                  })}
                                  className={inputCls()}
                                  placeholder="0"
                                />
                              </FormField>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeOption(optIdx)}
                              className={`${btnDanger} mt-5`}
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Values
                              </span>
                              <button
                                type="button"
                                onClick={() => addOptionValue(optIdx)}
                                className={btnSecondary}
                              >
                                <FiPlus size={12} /> Add Value
                              </button>
                            </div>
                            {optionValues.map((_, valIdx) => (
                              <div
                                key={valIdx}
                                className="flex items-center gap-2"
                              >
                                <div className="w-full">
                                  <input
                                    {...register(
                                      `options.${optIdx}.values.${valIdx}.value`,
                                      { required: true },
                                    )}
                                    className={`${inputCls()} flex-1 `}
                                    placeholder="e.g. Red, Small"
                                  />
                                </div>
                                <input
                                  {...register(
                                    `options.${optIdx}.values.${valIdx}.colorHex`,
                                  )}
                                  className={`${inputCls()} w-28`}
                                  placeholder="#FF0000 (color)"
                                />
                                <input
                                  type="number"
                                  min={0}
                                  {...register(
                                    `options.${optIdx}.values.${valIdx}.position`,
                                    { valueAsNumber: true },
                                  )}
                                  className={`${inputCls()} w-20`}
                                  placeholder="Pos"
                                />
                                {optionValues.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      removeOptionValue(optIdx, valIdx)
                                    }
                                    className={btnDanger}
                                  >
                                    <FiX size={14} />
                                  </button>
                                )}
                              </div>
                            ))}
                            {optionValues.length === 0 && (
                              <button
                                type="button"
                                onClick={() => addOptionValue(optIdx)}
                                className="w-full text-xs text-blue-500 border border-dashed border-blue-200 rounded-lg py-2 hover:bg-blue-50 transition-all"
                              >
                                + Add first value
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() =>
                        addOption({
                          name: "",
                          values: [{ value: "" }],
                          position: optionFields.length,
                        })
                      }
                      className="w-full py-3 text-sm text-blue-600 border-2 border-dashed border-blue-200 rounded-xl hover:bg-blue-50 flex items-center justify-center gap-2 transition-all"
                    >
                      <FiPlus size={16} /> Add Option
                    </button>
                  </div>
                </SectionCard>
              )}

              {/* Variants */}
              {hasVariants && (
                <SectionCard
                  icon={FiLayers}
                  iconColor="bg-orange-500"
                  title="Variants"
                  collapsible
                >
                  <div className="space-y-4">
                    {variantFields.map((varField, varIdx) => (
                      <div
                        key={varField.id}
                        className="border border-gray-100 rounded-xl overflow-hidden"
                      >
                        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                          <span className="text-sm font-semibold text-gray-700">
                            Variant #{varIdx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeVariant(varIdx)}
                            className={btnDanger}
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                        <div className="p-4 space-y-4">
                          {/* Option Values */}
                          <FormField
                            label="Option Values (comma separated)"
                            required
                            error={
                              errors.variants?.[varIdx]?.optionValues?.message
                            }
                          >
                            <input
                              {...register(`variants.${varIdx}.optionValues`, {
                                required: "Option values required",
                                setValueAs: (v) =>
                                  typeof v === "string"
                                    ? v
                                        .split(",")
                                        .map((s: string) => s.trim())
                                        .filter(Boolean)
                                    : v,
                              })}
                              className={inputCls(
                                errors.variants?.[varIdx]?.optionValues,
                              )}
                              placeholder="e.g. Red, M"
                            />
                            <p className="text-xs text-gray-400 mt-1">
                              Must match values defined in options above
                            </p>
                          </FormField>

                          <div className="grid grid-cols-3 gap-3">
                            <FormField
                              label="Price"
                              required
                              error={errors.variants?.[varIdx]?.price?.message}
                            >
                              <input
                                type="number"
                                step="0.01"
                                min={0}
                                {...register(`variants.${varIdx}.price`, {
                                  required: "Required",
                                  valueAsNumber: true,
                                })}
                                className={inputCls(
                                  errors.variants?.[varIdx]?.price,
                                )}
                                placeholder="0.00"
                              />
                            </FormField>
                            <FormField label="Compare At Price">
                              <input
                                type="number"
                                step="0.01"
                                min={0}
                                {...register(
                                  `variants.${varIdx}.compareAtPrice`,
                                  { valueAsNumber: true },
                                )}
                                className={inputCls()}
                                placeholder="0.00"
                              />
                            </FormField>
                            <FormField label="Cost Price">
                              <input
                                type="number"
                                step="0.01"
                                min={0}
                                {...register(`variants.${varIdx}.costPrice`, {
                                  valueAsNumber: true,
                                })}
                                className={inputCls()}
                                placeholder="0.00"
                              />
                            </FormField>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <FormField label="SKU">
                              <input
                                {...register(`variants.${varIdx}.sku`)}
                                className={inputCls()}
                                placeholder="Auto-generated if empty"
                              />
                            </FormField>
                            <FormField label="Barcode">
                              <input
                                {...register(`variants.${varIdx}.barcode`)}
                                className={inputCls()}
                                placeholder="1234567890123"
                              />
                            </FormField>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <FormField label="Stock (empty = unlimited)">
                              <input
                                type="number"
                                min={0}
                                {...register(`variants.${varIdx}.stock`, {
                                  valueAsNumber: true,
                                })}
                                className={inputCls()}
                                placeholder="0"
                              />
                            </FormField>
                            <FormField label="HS Code">
                              <input
                                {...register(`variants.${varIdx}.hsCode`)}
                                className={inputCls()}
                                placeholder="6109.10"
                              />
                            </FormField>
                          </div>

                          {/* Type-specific fields */}
                          {productType === "physical" && (
                            <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 space-y-3">
                              <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                                Physical Details
                              </p>
                              <div className="grid grid-cols-2 gap-3">
                                <FormField label="Weight (grams)">
                                  <input
                                    type="number"
                                    min={0}
                                    {...register(
                                      `variants.${varIdx}.weightGrams`,
                                      { valueAsNumber: true },
                                    )}
                                    className={inputCls()}
                                    placeholder="250"
                                  />
                                </FormField>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <FormField label="Length (cm)">
                                  <input
                                    type="number"
                                    min={0}
                                    {...register(
                                      `variants.${varIdx}.dimensions.length`,
                                      { valueAsNumber: true },
                                    )}
                                    className={inputCls()}
                                    placeholder="30"
                                  />
                                </FormField>
                                <FormField label="Width (cm)">
                                  <input
                                    type="number"
                                    min={0}
                                    {...register(
                                      `variants.${varIdx}.dimensions.width`,
                                      { valueAsNumber: true },
                                    )}
                                    className={inputCls()}
                                    placeholder="20"
                                  />
                                </FormField>
                                <FormField label="Height (cm)">
                                  <input
                                    type="number"
                                    min={0}
                                    {...register(
                                      `variants.${varIdx}.dimensions.height`,
                                      { valueAsNumber: true },
                                    )}
                                    className={inputCls()}
                                    placeholder="5"
                                  />
                                </FormField>
                              </div>
                            </div>
                          )}

                          {productType === "digital" && (
                            <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100 space-y-3">
                              <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">
                                Digital File
                              </p>
                              <div className="grid grid-cols-2 gap-3">
                                <FormField label="File URL">
                                  <input
                                    type="url"
                                    {...register(
                                      `variants.${varIdx}.digitalFileUrl`,
                                    )}
                                    className={inputCls()}
                                    placeholder="https://cdn.example.com/file.zip"
                                  />
                                </FormField>
                                <FormField label="File Name">
                                  <input
                                    {...register(
                                      `variants.${varIdx}.digitalFileName`,
                                    )}
                                    className={inputCls()}
                                    placeholder="software-v2.zip"
                                  />
                                </FormField>
                              </div>
                            </div>
                          )}

                          {productType === "service" && (
                            <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                              <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-3">
                                Service Details
                              </p>
                              <FormField label="Duration (minutes)">
                                <input
                                  type="number"
                                  min={1}
                                  {...register(
                                    `variants.${varIdx}.durationMinutes`,
                                    { valueAsNumber: true },
                                  )}
                                  className={inputCls()}
                                  placeholder="60"
                                />
                              </FormField>
                            </div>
                          )}

                          {/* Variant Bulk Pricing */}
                          <VariantBulkPricing
                            variantIndex={varIdx}
                            control={control}
                            register={register}
                          />
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => addVariant({ price: 0, optionValues: [] })}
                      className="w-full py-3 text-sm text-orange-600 border-2 border-dashed border-orange-200 rounded-xl hover:bg-orange-50 flex items-center justify-center gap-2 transition-all"
                    >
                      <FiPlus size={16} /> Add Variant
                    </button>
                  </div>
                </SectionCard>
              )}

              {/* SEO */}
              <SectionCard
                icon={FiTag}
                iconColor="bg-teal-500"
                title="SEO Meta"
                collapsible
              >
                <div className="space-y-4">
                  <FormField label="SEO Title">
                    <input
                      {...register("seoMeta.title")}
                      className={inputCls()}
                      placeholder="Buy Premium T-Shirt Online"
                    />
                  </FormField>
                  <FormField label="SEO Description">
                    <textarea
                      {...register("seoMeta.description")}
                      rows={3}
                      className={inputCls()}
                      placeholder="High quality cotton t-shirt..."
                    />
                  </FormField>
                  <FormField label="Keywords (comma separated)">
                    <input
                      {...register("seoMeta.keywords")}
                      className={inputCls()}
                      placeholder="t-shirt, cotton, fashion"
                    />
                  </FormField>
                </div>
              </SectionCard>
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="space-y-6">
              {/* Organization */}
              <SectionCard
                icon={FiTag}
                iconColor="bg-indigo-500"
                title="Organization"
              >
                <div className="space-y-4">
                  <FormField
                    label="Product Type"
                    required
                    error={errors.type?.message}
                  >
                    <Controller
                      name="type"
                      control={control}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <select {...field} className={inputCls(errors.type)}>
                          <option value="physical">Physical Product</option>
                          <option value="digital">Digital Product</option>
                          <option value="service">Service</option>
                        </select>
                      )}
                    />
                  </FormField>
                </div>
              </SectionCard>

              {/* Product Type specific top-level info */}
              {productType === "digital" && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider mb-1">
                    Digital Product
                  </p>
                  <p className="text-xs text-purple-600">
                    File URL and name are set per variant. Stock can be left
                    empty (unlimited).
                  </p>
                </div>
              )}
              {productType === "service" && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
                    Service Product
                  </p>
                  <p className="text-xs text-emerald-600">
                    Duration in minutes is set per variant. Stock usually left
                    empty.
                  </p>
                </div>
              )}

              {/* Price preview (simple product) */}
              {!hasVariants && (
                <SectionCard
                  icon={FiDollarSign}
                  iconColor="bg-green-500"
                  title="Price Preview"
                >
                  <SimplePricePreview watch={watch} />
                </SectionCard>
              )}

              {/* Summary */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-5 text-white shadow-lg shadow-blue-200">
                <h3 className="font-bold text-base mb-3">Quick Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-200">Type</span>
                    <span className="font-medium capitalize">
                      {productType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200">Variants</span>
                    <span className="font-medium">
                      {hasVariants
                        ? `${variantFields.length} variants`
                        : "Simple product"}
                    </span>
                  </div>
                  {hasVariants && (
                    <div className="flex justify-between">
                      <span className="text-blue-200">Options</span>
                      <span className="font-medium">
                        {optionFields.length} defined
                      </span>
                    </div>
                  )}
                  {!hasVariants && (
                    <div className="flex justify-between">
                      <span className="text-blue-200">Bulk Tiers</span>
                      <span className="font-medium">{bulkFields.length}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  type="submit"
                  form="product-form"
                  disabled={isLoading}
                  className="w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-sm shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                      Publishing...
                    </>
                  ) : (
                    <>
                      <FiPackage size={16} /> Publish Product
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => reset()}
                  className="w-full py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                >
                  Reset Form
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Profit Display ──────────────────────────────────────────
const ProfitDisplay = ({ watch }: { watch: any }) => {
  const price = parseFloat(watch("basePrice")) || 0;
  const cost = parseFloat(watch("bulkPricingTiers.0.price")) || 0;
  const profit = price - cost;
  const margin = price > 0 ? ((profit / price) * 100).toFixed(1) : "0";
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
        <p className="text-xs text-gray-500 mb-1">Base Price</p>
        <p className="text-lg font-bold text-emerald-600">
          ৳{price.toFixed(2)}
        </p>
      </div>
      <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
        <p className="text-xs text-gray-500 mb-1">Margin</p>
        <p className="text-lg font-bold text-gray-700">{margin}%</p>
      </div>
    </div>
  );
};

// ─── Variant Bulk Pricing ────────────────────────────────────
const VariantBulkPricing = ({ variantIndex, control, register }: any) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `variants.${variantIndex}.bulkPricingTiers`,
  });
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Bulk Pricing Tiers
        </span>
        <button
          type="button"
          onClick={() => append({ minQty: 1, price: 0 })}
          className="text-xs text-blue-500 flex items-center gap-1 hover:text-blue-700"
        >
          <FiPlus size={12} /> Add Tier
        </button>
      </div>
      <div className="space-y-2">
        {fields.map((f, i) => (
          <div
            key={f.id}
            className="grid grid-cols-5 gap-2 p-2.5 bg-gray-50 rounded-lg border border-gray-100"
          >
            <input
              type="number"
              min={1}
              {...register(
                `variants.${variantIndex}.bulkPricingTiers.${i}.minQty`,
                { valueAsNumber: true },
              )}
              className={inputCls()}
              placeholder="Min"
            />
            <input
              type="number"
              min={1}
              {...register(
                `variants.${variantIndex}.bulkPricingTiers.${i}.maxQty`,
                { valueAsNumber: true },
              )}
              className={inputCls()}
              placeholder="Max"
            />
            <input
              type="number"
              step="0.01"
              min={0}
              {...register(
                `variants.${variantIndex}.bulkPricingTiers.${i}.price`,
                { valueAsNumber: true },
              )}
              className={inputCls()}
              placeholder="Price"
            />
            <input
              type="number"
              step="0.01"
              min={0}
              max={100}
              {...register(
                `variants.${variantIndex}.bulkPricingTiers.${i}.discountPercent`,
                { valueAsNumber: true },
              )}
              className={inputCls()}
              placeholder="Disc%"
            />
            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={() => remove(i)}
                className={btnDanger}
              >
                <FiTrash2 size={13} />
              </button>
            </div>
          </div>
        ))}
        {fields.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-2 border border-dashed border-gray-200 rounded-lg">
            No tiers
          </p>
        )}
      </div>
    </div>
  );
};

export default AddProduct;
