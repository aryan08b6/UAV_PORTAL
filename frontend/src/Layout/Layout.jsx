import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../Components/Common/Navbar';

const Layout = () => {
    return (
        <div className='h-screen flex flex-col'>
            <header>
                <Navbar />
            </header>
            <main className='flex-grow flex items-center justify-center'>
                <Outlet />
            </main>
            <footer className='text-center'>
                <p>&copy; 2023 UAV Portal</p>
            </footer>
        </div>
    );
};

export default Layout;
