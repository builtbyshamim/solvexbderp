import React, { useState, useRef, useEffect } from "react";

function JustSelectAndSearch({
  placeholder,
  options = [],
  onChange = () => {},
  handleSelected = () => {},
  onCreate = null,
  setActiveModal,
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option) => {
    setSelected(option.label);
    handleSelected(option);
    setOpen(false);
  };

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="" ref={dropdownRef}>
      <div className="custom-select relative">
        <button
          type="button"
          className="select-btn w-full text-sm border border-gray-300 bg-white text-gray-700 py-2 px-3 rounded flex justify-between items-center"
          onClick={() => setOpen(!open)}
        >
          <span className="select-text">
            {selected || placeholder || "Select..."}
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 9l6 6 6-6"
            />
          </svg>
        </button>

        {open && (
          <div className="select-menu absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded shadow max-h-60 overflow-auto custom-select-scroll">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                onChange(e.target.value);
              }}
              className="w-full px-3 text-sm py-2 border-b border-gray-200 focus:outline-none"
            />

            {filteredOptions.map((option, index) => (
              <li
                key={index}
                className={`px-3 py-2 cursor-pointer hover:bg-[#E6F8EF] text-sm text-[#26272F] rounded list-none ${
                  selected === option.label ? "bg-[#E6F8EF] text-[#00B45F]" : ""
                }`}
                onClick={() => handleSelect(option)}
              >
                {option.label}
              </li>
            ))}

            {onCreate && (
              <button
                type="button"
                className="w-full text-left px-3 py-2 mt-1 text-sm cursor-pointer border-t border-gray-200 hover:bg-gray-100 rounded text-[#00B45F]"
                onClick={() => {
                  setActiveModal(true);
                  setSearchTerm("");
                }}
              >
                + Create {onCreate}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default JustSelectAndSearch;
