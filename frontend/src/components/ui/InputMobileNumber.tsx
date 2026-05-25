function InputMobileNumber({
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
  type = "text", // default type
}: any) {
  return (
    <div>
      <label className="block text-sm font-medium capitalize text-gray-700 mb-1">
        {label}{" "}
        {disable_content && (
          <span className="bg-primary-300">{disable_content}</span>
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
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors && errors[name] ? "border-red-500" : ""}`}
        {...(register
          ? register(name, {
              required: required ? "Mobile number is required" : false,
              pattern: {
                value: /^01\d{9}$/,
                message:
                  "Invalid mobile number. Must start with 01 and be 11 digits.",
              },
            })
          : {})}
      />

      {errors && errors[name] && (
        <p className="text-red-500 text-sm mt-1">
          {errors[name].message || "This field is required"}
        </p>
      )}
    </div>
  );
}

export default InputMobileNumber;
