import { FaRegEye } from "react-icons/fa";
import { Link } from "react-router-dom";
const EditWithLinkIcon = ({ link }: any) => {
  return (
    <Link
      to={link}
      className="p-1.5 block cursor-pointer border border-primary-500 rounded  hover:text-white hover:bg-primary-400 text-primary-500 w-fit group"
    >
      <FaRegEye />
    </Link>
  );
};

export default EditWithLinkIcon;
