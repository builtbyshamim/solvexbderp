
function InputString({
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
  type = "text",
}: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {disable_content && (
          <span className="text-primary-300">{disable_content}</span>
        )}
        {required && <span className="text-red-500">*</span>}
      </label>

      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 
          ${errors && errors[name] ? "border-rose-400 bg-rose-50" : "border-gray-200 bg-gray-50 hover:border-gray-300"}
        } ${readOnly ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
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

export default InputString;
