import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { addUserDetails, removeUserDetails } from './redux/slices/userSlice'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import axios from 'axios'
import Layout from './Layout/Layout'
import Home from './Components/Common/Home'
import About from './Components/Common/About'
import Cart from './Components/Common/Cart'
import Shop from './Components/Common/Shop'
import Signup from './Components/Common/Signup'
import Login from './Components/Common/Login'
import UserDashboard from './Components/User/UserDashboard'
import AdminDashboard from './Components/Admin/AdminDashboard'
import AdminAccount from './Components/Admin/AdminAccount'
import UserAccount from './Components/User/UserAccount'
import PleaseLogin from './Components/Common/PleaseLogin'

const App = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);


  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/v1/users/current-user', {
          withCredentials: true
        });
        console.log('User details:', response.data);
        dispatch(addUserDetails(response.data));
      } catch (error) {
        console.error('Error fetching user details:', error);
      }
    };
    fetchUserDetails();
  }, [dispatch])

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="home" element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="cart" element={<Cart />} />
          <Route path="shop" element={<Shop />} />
          <Route path="register" element={<Signup />} />
          <Route path="login" element={<Login />} />
          <Route path="dashboard" element={
            user.type == "loggedOut" ? (<PleaseLogin />) : user.type == "Admin" ? (<AdminDashboard />) : (<UserDashboard />)
          } />
          <Route path="account" element={
            user.type == "loggedOut" ? (<PleaseLogin />) : user.type == "Admin" ? (<AdminAccount />) : (<UserAccount />)
          } />
        </Route>
      </Routes>
    </Router>

  )
}

export default App
