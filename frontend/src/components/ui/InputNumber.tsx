function InputNumber({
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
  symble = "৳",
}: any) {
  // Regex to allow integer or float numbers
  const numberPattern = /^-?\d*(\.\d+)?$/;

  return (
    <div className="mb-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{" "}
        {disable_content && (
          <span className="text-primary-400">{disable_content}</span>
        )}
        {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {symble && (
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            {symble}
          </span>
        )}

        <input
          type={"number"}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          step={"any"}
          readOnly={readOnly}
          className={`w-full ${symble ? "pl-8 " : ""} px-3  py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${errors && errors[name] ? "border-rose-400 bg-rose-50" : "border-gray-200 bg-gray-50 hover:border-gray-300"} ${readOnly ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
          {...(register
            ? register(name, {
                required: required ? "This field is required" : false,
                pattern: {
                  value: numberPattern,
                  message: "Please enter a valid number",
                },
              })
            : {})}
        />
      </div>

      {errors && errors[name] && (
        <p className="text-red-500 text-sm mt-1">{errors[name].message}</p>
      )}
    </div>
  );
}

export default InputNumber;
