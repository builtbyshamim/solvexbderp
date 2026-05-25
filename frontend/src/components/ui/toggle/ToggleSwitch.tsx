import React from 'react';
interface ToggleSwitchProps {
  name: string;
  label: string;
  register: any;
  errors?: any;
  defaultValue?: boolean;
  onToggle?: (isActive: boolean) => void;
  disabled?: boolean;
  helperText?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  name,
  label,
  register,
  errors,
  defaultValue = false,
  onToggle,
  disabled = false,
  helperText,
}) => {
  const [isChecked, setIsChecked] = React.useState(defaultValue);
  const error = errors?.[name];

  const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setIsChecked(newValue);
    onToggle?.(newValue);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor={name}
          className={`text-sm font-medium cursor-pointer ${
            disabled ? 'text-gray-400' : 'text-gray-700'
          }`}
        >
          {label}
        </label>
        
        <div className="relative inline-flex items-center">
          <input
            type="checkbox"
            id={name}
            {...register(name, {
              onChange: handleToggle,
            })}
            defaultChecked={defaultValue}
            disabled={disabled}
            className="sr-only peer"
          />
          
          <div
            className={`
              w-11 h-6 rounded-full peer 
              transition-colors duration-200 ease-in-out
              ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-400
              ${isChecked ? 'bg-primary-500' : 'bg-gray-300'}
            `}
          >
            <div
              className={`
                absolute top-0.5 left-0.5 
                bg-white rounded-full h-5 w-5 
                transition-transform duration-200 ease-in-out
                ${isChecked ? 'translate-x-5' : 'translate-x-0'}
              `}
            />
          </div>
          
          <span
            className={`ml-3 text-sm font-medium ${
              disabled ? 'text-gray-400' : isChecked ? 'text-primary-500' : 'text-gray-500'
            }`}
          >
            {isChecked ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {helperText && !error && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}
      
      {error && (
        <p className="text-xs text-red-600">
          {error.message?.toString() || 'This field is required'}
        </p>
      )}
    </div>
  );
};

export default ToggleSwitch;