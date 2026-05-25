import { FaRegEye } from "react-icons/fa";
const EditWithActionIcon = ({ item, onClick }: any) => {
  return (
    <button
      onClick={() => onClick(item)}
      className="p-1.5 block cursor-pointer border border-primary-500 rounded  hover:text-white hover:bg-primary-400 text-primary-500 w-fit group"
    >
      <FaRegEye className="w-3 h-3" />
    </button>
  );
};

export default EditWithActionIcon;
