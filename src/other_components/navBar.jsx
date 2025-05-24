// src/components/NavBar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';

const NavBar = () => {
    const linkClasses = ({ isActive }) =>
        isActive
            ? 'text-blue-400 border-b-2 border-blue-400 pb-1'
            : 'text-white hover:text-blue-200';

    return (
        <nav className="bg-gray-800 text-white p-4">
            <ul className="flex space-x-6">
                <li>
                    <NavLink to="/dashboard" className={linkClasses}>
                        Dashboard
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/exercises" className={linkClasses}>
                        Exercises
                    </NavLink>
                </li>
                <li>
                    <NavLink to="/sessions" className={linkClasses}>
                        Sessions
                    </NavLink>
                </li>
            </ul>
        </nav>
    );
};

export default NavBar;
