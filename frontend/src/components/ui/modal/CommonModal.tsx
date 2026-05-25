// components/Modal.jsx
import React, { useEffect } from "react";
import { IoIosClose } from "react-icons/io";

const CommonModal = ({
  isOpen,
  onClose,
  title,
  children,
  default_width = "md:min-w-[500px]",
}:any) => {
  // Close modal on Esc key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-600 flex items-center justify-center px-1  md:px-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal content */}
      <div
        className={`relative bg-white  rounded-lg ${default_width}  shadow-lg w-full md:w-auto max-w-full mx-auto transform transition-all duration-300 scale-95 opacity-0 animate-modal-in`}
      >
        {/* Close button */}
        <button
          className="absolute top-3 cursor-pointer hover:text-red-500 right-3 text-gray-500 "
          onClick={onClose}
        >
          <IoIosClose size={24} />
        </button>

        {/* Modal header */}
        {title && (
          <div className="px-6 py-4 capitalize border-b border-gray-200 font-semibold text-lg md:text-xl">
            {title}
          </div>
        )}

        {/* Modal body */}
        {/* Modal body */}
        <div className="px-3 md:px-6 py-4 text-sm md:text-base min-w-62.5 max-h-[90vh] overflow-y-auto">
          {children}
        </div>
      </div>

      {/* Tailwind animation */}
      <style>
        {`
          @keyframes modal-in {
            0% { opacity: 0; transform: scale(0.95); }
            100% { opacity: 1; transform: scale(1); }
          }
          .animate-modal-in {
            animation: modal-in 0.25s ease-out forwards;
          }
        `}
      </style>
    </div>
  );
};

export default CommonModal;
