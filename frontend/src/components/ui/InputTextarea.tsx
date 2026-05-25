import React from "react";

function InputTextarea({
  label,
  placeholder,
  name,
  register,
  errors,
  value,
  onChange,
  readOnly = false,
  required = true,
  disable_content = null,
  rows = 2, // default number of rows
}: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{" "}
        {disable_content && (
          <span className="text-primary-500">{disable_content}</span>
        )}
        {required && <span className="text-red-500">*</span>}
      </label>

      <textarea
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        rows={rows}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none 
          ${errors && errors[name] ? "border-rose-400 bg-rose-50" : "border-gray-200 bg-gray-50 hover:border-gray-300"}
          `}
        {...(register ? register(name, { required }) : {})}
      />

      {errors && errors[name] && (
        <p className="text-red-500 text-sm mt-1">
          {errors[name].message || "This field is required"}
        </p>
      )}
    </div>
  );
}

export default InputTextarea;
