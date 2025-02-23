import React from 'react'
import { NavLink } from 'react-router-dom'
import { TbDashboard, TbHome, TbInfoCircle, TbLogin, TbShoppingBag, TbShoppingCartBolt, TbUser, TbDrone } from "react-icons/tb"
import { useSelector } from 'react-redux'

const Navbar = () => {

    const commonRoutes = [
        {
            to: "home",
            title: "Home",
            Icon: TbHome
        },
        {
            to: "about",
            title: "About",
            Icon: TbInfoCircle
        },
        {
            to: "shop",
            title: "Shop",
            Icon: TbShoppingBag
        },
        {
            to: "cart",
            title: "Cart",
            Icon: TbShoppingCartBolt
        },
    ]

    const commonRside = [
        {
            to: "login",
            title: "Login",
            Icon: TbLogin
        },
        {
            to: "register",
            title: "Register",
            Icon: TbLogin
        },
    ]


    const userRight = [
        {
            to: "account",
            title: "Account",
            Icon: TbUser
        },
        {
            to: "Dashboard",
            title: "Dashboard",
            Icon: TbDashboard
        },
    ]

    const user = useSelector((state) => state.user);

    return (
        <div className='flex flex-row justify-between items-center bg-gray-800 text-white w-screen h-16'>
            <TbDrone className='size-12 stroke-1' />
            <div className='flex flex-row justify-start items-center gap-2 p-4'>
                {
                    commonRoutes.map((route, index) => (
                        <NavLink key={index} to={route.to} className='mr-4 flex flex-col  items-center justify-center'>
                            <h1>{route.title}</h1>
                            <route.Icon className='size-8 stroke-1' />
                        </NavLink>
                    ))
                }
            </div>
            <div className='flex flex-row justify-end items-center gap-2 p-4'>
                {
                    user.name === '' ? commonRside.map((route, index) => (
                        <NavLink key={index} to={route.to} className='mr-4 flex flex-col  items-center justify-center'>
                            <h1>{route.title}</h1>
                            <route.Icon className='size-8 stroke-1' />
                        </NavLink>
                    )) : userRight.map((route, index) => (
                        <NavLink key={index} to={route.to} className='mr-4 flex flex-col  items-center justify-center'>
                            <h1>{route.title}</h1>
                            <route.Icon className='size-8 stroke-1' />
                        </NavLink>
                    ))
                }
            </div>
        </div>
    )
}

export default Navbar
