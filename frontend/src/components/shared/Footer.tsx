import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <div   className={'bg-white shadow-sm fixed  text-sm w-full bottom-0 px-3 flex items-center flex-wrap  justify-center py-2'}>
            Copyright © {new Date().getFullYear()} Next Admin
            Developed by <Link to={'/'}>SolvexDB</Link>. All rights reserved.
        </div>
    );
};

export default Footer;
