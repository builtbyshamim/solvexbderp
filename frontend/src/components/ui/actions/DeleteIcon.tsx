// components/ui/actions/DeleteIcon.tsx
import { useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import DeleteConfirmationModal from "../modal/DeleteConfirmationModal";

interface DeleteActionProps {
  handleDelete: (item: any) => Promise<void>;
  item: any;
  isDeleting?: boolean;
  disabled?: boolean;
  tooltip?: string;
  itemName?: string;
}

const DeleteAction = ({
  handleDelete,
  item,
  isDeleting = false,
  disabled = false,
  itemName = "this item",
  tooltip = "Delete",
}: DeleteActionProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      setIsModalOpen(true);
    }
  };

  const handleConfirm = async () => {
    await handleDelete(item);
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={disabled || isDeleting}
        className={`p-1.5 cursor-pointer border border-red-500 hover:text-white duration-150 hover:bg-red-500 rounded-md transition-colors ${
          isDeleting
            ? "bg-red-100 text-red-400 cursor-not-allowed"
            : disabled
              ? "text-gray-300 cursor-not-allowed"
              : "text-red-600 hover:bg-red-50 hover:text-red-700"
        }`}
        title={tooltip}
      >
        {isDeleting ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600" />
        ) : (
          <FiTrash2 className="w-3 h-3" />
        )}
      </button>

      <DeleteConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirm}
        title={tooltip}
        description="Are you sure you want to delete"
        itemName={itemName}
      />
    </>
  );
};

export default DeleteAction;
