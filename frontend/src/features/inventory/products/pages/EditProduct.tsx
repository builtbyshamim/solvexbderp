import { useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FiSave,
  FiPlus,
  FiTrash2,
  FiX,
  FiDollarSign,
  FiTag,
  FiLayers,
  FiInfo,
  FiGrid,
  FiChevronDown,
  FiChevronUp,
  FiArrowLeft,
} from "react-icons/fi";
import { BsBoxSeam } from "react-icons/bs";
import toast from "react-hot-toast";
import {
  useGetSingleProductQuery,
  useUpdateProductMutation,
} from "../productApi";

// ─── Types ────────────────────────────────────────────────────
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

// ─── Shared UI ───────────────────────────────────────────────
const SectionCard = ({
  icon: Icon,
  iconColor,
  title,
  children,
  collapsible = false,
}: any) => {
  const [open, setOpen] = (useState as any)(true);
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

// ─── Price Preview ────────────────────────────────────────────
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

// ─── Variant Bulk Pricing ─────────────────────────────────────
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

// ─── Skeleton Loader ──────────────────────────────────────────
const SkeletonLoader = () => (
  <div className="animate-pulse space-y-6">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="bg-white rounded-xl border border-gray-100 p-6 space-y-4"
      >
        <div className="h-4 bg-gray-200 rounded w-1/4" />
        <div className="h-10 bg-gray-100 rounded" />
        <div className="h-10 bg-gray-100 rounded" />
      </div>
    ))}
  </div>
);

// ─── Main Component ───────────────────────────────────────────
import { useState } from "react";
import { useGetAllCategoryQuery } from "../../category/categoryApi";
import { useGetAllBrandQuery } from "../../brand/brandApi";
import SelectAndSearch from "../../../../components/ui/SelectAndSearch";
import JoditTextEditor from "../../../../components/ui/editor/JoditTextEditor";

const EditProduct = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: productRes, isLoading: isFetching } = useGetSingleProductQuery(
    id!,
  );
  const [description, setDescription] = useState("");
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation();
  const { data: categoryData } = useGetAllCategoryQuery({ search: "" });
  const { data: brandData } = useGetAllBrandQuery({ search: "" });
  console.log(description, "description");
  console.log(categoryData, "brandDatabrandData");
  const {
    register,
    control,
    handleSubmit,
    watch,
    trigger,
    clearErrors,
    setValue,
    reset,
    formState: { errors, isDirty },
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

  // ── Populate form from API data ──────────────────────────────
  useEffect(() => {
    const p = productRes?.data;
    if (!p) return;

    // Map variants: optionValues from nested relations → string[]
    const mappedVariants = (p.variants ?? []).map((v: any) => ({
      sku: v.sku,
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      costPrice: v.costPrice,
      stock: v.stock,
      weightGrams: v.weightGrams,
      dimensions: v.dimensions,
      digitalFileUrl: v.digitalFileUrl,
      digitalFileName: v.digitalFileName,
      durationMinutes: v.durationMinutes,
      barcode: v.barcode,
      hsCode: v.hsCode,
      bulkPricingTiers: v.bulkPricingTiers ?? [],
      optionValues: (v.variantOptionValues ?? []).map(
        (vov: any) => vov.optionValue?.value ?? "",
      ),
    }));

    // Map options
    const mappedOptions = (p.options ?? []).map((o: any) => ({
      name: o.name,
      position: o.position,
      values: (o.values ?? []).map((val: any) => ({
        value: val.value,
        colorHex: val.colorHex,
        position: val.position,
      })),
    }));

    reset({
      name: p.name ?? "",
      type: p.type ?? "physical",
      categoryId: p.categoryId ?? "",
      brandId: p.brandId ?? "",
      moq: p.moq ?? 1,
      seoMeta: {
        title: p.seoMeta?.title ?? "",
        description: p.seoMeta?.description ?? "",
        keywords: Array.isArray(p.seoMeta?.keywords)
          ? p.seoMeta.keywords.join(", ")
          : (p.seoMeta?.keywords ?? ""),
      },
      hasVariants: p.hasVariants ?? false,
      basePrice: p.basePrice ?? 0,
      baseStock: p.baseStock ?? 0,
      options: mappedOptions,
      variants: mappedVariants,
      bulkPricingTiers: p.bulkPricingTiers ?? [],
    });
    setDescription(p.description);
  }, [productRes, reset]);

  // Option value helpers
  const addOptionValue = (optIdx: number) => {
    const current = watch(`options.${optIdx}.values`) || [];
    setValue(`options.${optIdx}.values`, [
      ...current,
      { value: "", position: current.length },
    ]);
  };
  const removeOptionValue = (optIdx: number, valIdx: number) => {
    const current = watch(`options.${optIdx}.values`) || [];
    setValue(
      `options.${optIdx}.values`,
      current.filter((_: any, i: number) => i !== valIdx),
    );
  };

  // ── Submit ───────────────────────────────────────────────────
  const onSubmit = async (data: FormValues) => {
    try {
      if (data.seoMeta?.keywords) {
        (data as any).seoMeta.keywords = (data.seoMeta.keywords as any)
          .split(",")
          .map((k: string) => k.trim())
          .filter(Boolean);
      }
      data.description = description;
      const res = await updateProduct({ id: id!, data }).unwrap();
      console.log(res, "resres");
      if (res.success) {
        toast.success("Product updated successfully!");
      } else {
        toast.error(res.message || "Failed to update product.");
      }
    } catch (error: any) {
      console.log(error, "error");
      toast.error(
        error?.data?.message || error?.message || "Failed to update product.",
      );
    }
  };

  if (isFetching)
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 p-6">
        <SkeletonLoader />
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl border border-gray-200 hover:bg-white transition-all text-gray-500"
            >
              <FiArrowLeft size={18} />
            </button>
            <div className="p-2 bg-indigo-600 rounded-xl">
              <BsBoxSeam className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Edit Product
              </h1>
              <p className="text-xs text-gray-400">ID: {id}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          {isDirty && (
            <span className="self-center text-xs text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full font-medium">
              Unsaved changes
            </span>
          )}
          <Link
            to={`/admin/manage-products/media/${productRes?.data?.id}`}
            type="button"
            className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-white transition-all"
          >
            Update Midea
          </Link>
          <button
            type="submit"
            form="edit-product-form"
            disabled={isUpdating}
            className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm shadow-blue-200 disabled:opacity-60"
          >
            {isUpdating ? (
              <>
                <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                Saving...
              </>
            ) : (
              <>
                <FiSave size={14} /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      <form id="edit-product-form" onSubmit={handleSubmit(onSubmit)}>
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
                      required: "Required",
                      minLength: { value: 3, message: "Min 3 chars" },
                    })}
                    className={inputCls(errors.name)}
                    placeholder="Product name"
                  />
                </FormField>

                <div>
                  <JoditTextEditor
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
                <FormField label="MOQ">
                  <input
                    type="number"
                    min={1}
                    {...register("moq", { valueAsNumber: true })}
                    className={inputCls()}
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
              {/* has variants toggle */}
              <div className="mb-4">
                <label className="flex items-center gap-3 cursor-pointer">
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
                    This product has variants
                  </span>
                </label>
              </div>

              {!hasVariants && (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
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
                            required: !hasVariants && "Required",
                            valueAsNumber: true,
                          })}
                          className={`${inputCls((errors as any).basePrice)} pl-7`}
                          placeholder="0.00"
                        />
                      </div>
                    </FormField>
                    <FormField label="Base Stock">
                      <input
                        type="number"
                        min={0}
                        {...register("baseStock", { valueAsNumber: true })}
                        className={inputCls()}
                        placeholder="0"
                      />
                    </FormField>
                  </div>

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
                    <div className="space-y-4">
                      <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                        <p className="text-xs text-amber-600 font-medium mb-3">
                          No bulk tiers — set a compare price to show discount.
                        </p>
                        <FormField label="Compare At Price">
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
                      <SimplePricePreview watch={watch} />
                    </div>
                  ) : (
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
                </>
              )}
            </SectionCard>

            {/* Options (variant product) */}
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
                                placeholder="Color, Size..."
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
                          {optionValues.map((_: any, valIdx: number) => (
                            <div
                              key={valIdx}
                              className="flex items-center gap-2"
                            >
                              <div>
                                <input
                                  {...register(
                                    `options.${optIdx}.values.${valIdx}.value`,
                                    { required: true },
                                  )}
                                  className={`${inputCls()} flex-1`}
                                  placeholder="e.g. Red, Small"
                                />
                              </div>
                              <input
                                {...register(
                                  `options.${optIdx}.values.${valIdx}.colorHex`,
                                )}
                                className={`${inputCls()} w-28`}
                                placeholder="#FF0000"
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
                        <FormField
                          label="Option Values (comma separated)"
                          required
                          error={
                            errors.variants?.[varIdx]?.optionValues?.message
                          }
                        >
                          <input
                            {...register(`variants.${varIdx}.optionValues`, {
                              required: "Required",
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
                            placeholder="Red, M"
                            defaultValue={watch(
                              `variants.${varIdx}.optionValues`,
                            )?.join(", ")}
                          />
                          <p className="text-xs text-gray-400 mt-1">
                            Must match values in options above
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
                              placeholder="Auto if empty"
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
                          <FormField label="Stock">
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

                        {productType === "physical" && (
                          <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 space-y-3">
                            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                              Physical Details
                            </p>
                            <FormField label="Weight (grams)">
                              <input
                                type="number"
                                min={0}
                                {...register(`variants.${varIdx}.weightGrams`, {
                                  valueAsNumber: true,
                                })}
                                className={inputCls()}
                                placeholder="250"
                              />
                            </FormField>
                            <div className="grid grid-cols-3 gap-2">
                              {["length", "width", "height"].map((dim) => (
                                <FormField
                                  key={dim}
                                  label={`${dim.charAt(0).toUpperCase() + dim.slice(1)} (cm)`}
                                >
                                  <input
                                    type="number"
                                    min={0}
                                    {...register(
                                      `variants.${varIdx}.dimensions.${dim}` as any,
                                      { valueAsNumber: true },
                                    )}
                                    className={inputCls()}
                                    placeholder="0"
                                  />
                                </FormField>
                              ))}
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
                                  placeholder="https://..."
                                />
                              </FormField>
                              <FormField label="File Name">
                                <input
                                  {...register(
                                    `variants.${varIdx}.digitalFileName`,
                                  )}
                                  className={inputCls()}
                                  placeholder="file.zip"
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
                    placeholder="High quality..."
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
            <SectionCard
              icon={FiTag}
              iconColor="bg-indigo-500"
              title="Organization"
            >
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
            </SectionCard>

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
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-xl p-5 text-white shadow-lg shadow-indigo-200">
              <h3 className="font-bold text-base mb-3">Quick Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-indigo-200">Type</span>
                  <span className="font-medium capitalize">{productType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-indigo-200">Variants</span>
                  <span className="font-medium">
                    {hasVariants
                      ? `${variantFields.length} variants`
                      : "Simple product"}
                  </span>
                </div>
                {hasVariants && (
                  <div className="flex justify-between">
                    <span className="text-indigo-200">Options</span>
                    <span className="font-medium">
                      {optionFields.length} defined
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Save button */}
            <div className="space-y-3">
              <button
                type="submit"
                form="edit-product-form"
                disabled={isUpdating}
                className="w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-sm shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isUpdating ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                    Saving...
                  </>
                ) : (
                  <>
                    <FiSave size={16} /> Save Changes
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-full py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditProduct;
