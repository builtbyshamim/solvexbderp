import {Link} from "react-router-dom";

interface AddNewButtonProps {
    active?: (value: boolean) => void;
    status?: boolean;
    text: string;
    link?: string;
}

const AddNewButton = ({active, status = false, text, link = '/'}: AddNewButtonProps) => {
    return (<>
            {
                status == true ? <button  onClick={()=>active?.(true)} className={'bg-primary-500 cursor-pointer px-3 py-[6px] text-white rounded text-sm'}>
                    {text}
                </button> : <Link to={link} className={'bg-primary-500 px-3 py-[6px] text-white rounded text-sm'}>
                    {text}
                </Link>
            }
        </>

    );
};

export default AddNewButton;

