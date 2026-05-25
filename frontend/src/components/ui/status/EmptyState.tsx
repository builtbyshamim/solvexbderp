import { FiInbox } from "react-icons/fi";
import { Link } from "react-router-dom";

export const EmptyState = ({
  message = "No found",
  actionText = "Add your first item",
  actionLink = null,
}: any) => (
  <div className="flex flex-col items-center justify-center py-20 text-gray-500">
    <FiInbox size={48} className="mb-4 text-gray-300" />
    <p className="text-lg font-medium"> {message} </p>
    <p className="text-sm">{actionText}</p>
    {actionLink && <Link to={actionLink}>Add New</Link>}
  </div>
);
