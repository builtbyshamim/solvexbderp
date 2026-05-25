import { useState, useRef, useEffect } from "react";

interface SelectOption {
  label: string;
  value: any;
}

interface SelectAndSearchProps {
  label: string;
  onChange?: (value: string) => void;
  handleSelected?: (option: SelectOption) => void;
  onScrollEnd?: () => void;
  placeholder?: string;
  options?: SelectOption[];
  register?: any;
  setValue?: any;
  trigger?: any;
  name: string;
  errors?: any;
  onCreate?: string;
  setActiveModal?: (active: boolean) => void;
  required?: boolean;
  clearErrors?: any;
  defaultValue?: string; // label string — edit mode এর জন্য
}

function SelectAndSearch({
  label,
  onChange = () => {},
  handleSelected = () => {},
  onScrollEnd = () => {},
  placeholder,
  options = [],
  register,
  setValue,
  trigger,
  name,
  errors,
  onCreate = null,
  setActiveModal,
  required = true,
  clearErrors,
  defaultValue = "",
}: SelectAndSearchProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(defaultValue);
  const [searchTerm, setSearchTerm] = useState("");
  const listRef = useRef(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // edit mode: defaultValue বা options change হলে selected update করো
  useEffect(() => {
    if (defaultValue) {
      setSelected(defaultValue);
    }
  }, [defaultValue]);

  // close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: SelectOption) => {
    setSelected(option.label);
    handleSelected(option);
    setOpen(false);
    setSearchTerm("");
    onChange(""); // search clear করো যাতে full list আবার load হয়

    if (setValue && trigger) {
      setValue(name, option.value);
      trigger(name);
    }

    if (clearErrors) {
      clearErrors(name);
    }
  };

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleScroll = () => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 5) {
      onScrollEnd();
    }
  };

  return (
    <div className="mb-2" ref={dropdownRef}>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {/* Hidden input for form validation */}
      {register && (
        <input
          type="hidden"
          {...register(name, {
            required: required ? `${label} field is required` : false,
          })}
        />
      )}

      <div className="custom-select relative">
        <button
          type="button"
          className={`select-btn w-full text-sm border border-gray-200 bg-gray-50 text-gray-700 py-2.5 px-3 rounded-lg flex justify-between items-center ${
            errors && errors[name] ? "border-rose-400 bg-rose-50" : ""
          }`}
          onClick={() => setOpen(!open)}
        >
          <span className="select-text truncate">
            {selected || placeholder || "Select..."}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-4 h-4 shrink-0"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 9l6 6 6-6"
            />
          </svg>
        </button>

        {open && (
          <div className="select-menu absolute z-100 mt-1 w-full bg-white border border-gray-200 rounded shadow max-h-60 overflow-auto custom-select-scroll">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                onChange(e.target.value); // parent কে জানাও — API search এর জন্য
              }}
              className="w-full px-3 text-sm py-2 border-b border-gray-200 focus:outline-none focus:border-primary-500"
              autoFocus
            />

            <div className="max-h-48 overflow-y-auto custom-select-scroll">
              {filteredOptions?.length > 0 ? (
                filteredOptions.map((option: SelectOption, index: number) => (
                  <div
                    ref={listRef}
                    onScroll={handleScroll}
                    key={index}
                    className={`px-3 py-2 cursor-pointer hover:bg-primary-300 text-sm text-[#26272F] rounded ${
                      selected === option.label
                        ? "bg-primary-300 text-primary-500"
                        : ""
                    }`}
                    onClick={() => handleSelect(option)}
                  >
                    {option.label}
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500 text-center">
                  No options found
                </div>
              )}
            </div>

            {onCreate && (
              <button
                type="button"
                className="w-full text-left px-3 py-2 mt-1 text-sm cursor-pointer border-t border-gray-200 hover:bg-gray-100 rounded text-primary-500"
                onClick={() => {
                  if (setActiveModal) setActiveModal(true);
                  setOpen(false);
                  setSearchTerm("");
                }}
              >
                + Create {onCreate}
              </button>
            )}
          </div>
        )}
      </div>

      {errors?.[name] && (
        <span className="text-rose-500 text-xs mt-1">
          {errors[name]?.message || "This field is required"}
        </span>
      )}
    </div>
  );
}

export default SelectAndSearch;
