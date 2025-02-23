import React from 'react'
import axios from 'axios'
import Button from '../Common/Button';
import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';

const logout = async () => {
  try {
    const response = await axios.post('http://localhost:3000/api/v1/users/logout', {}, { withCredentials: true });
    if (response.status === 200) {
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Error logging out:', error);
  }
}

const Account = () => {

  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.post('http://localhost:3000/api/v1/order/user/get-orders', {}, {
          withCredentials: true
        });
        setOrders(response.data.data);
        console.log(response.data.data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };

    fetchOrders();
  }, []);


  return (
    <div>
      <Button func={logout} command={"Logout"}>
        Logout
      </Button>

      <div className='w-auto p-4'>
        <h1 className='text-3xl mb-4'>Orders</h1>
        {orders.map(order => (
          <div key={order._id} className='w-auto border-2 rounded-2xl p-4 mb-4'>
            <h2 className='text-xl'>Order ID: {order._id}</h2>
            <p>Status: {order.status}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Account
