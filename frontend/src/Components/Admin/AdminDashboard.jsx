import React, { useState, useEffect } from 'react';
import Button from '../Common/Button';
import axios from 'axios';
import { useSelector } from 'react-redux';

const AdminDashboard = () => {
  const [locale, setLocale] = useState('');
  const [name, setName] = useState('');
  const [warehouseName, setWarehouseName] = useState('');
  const [stock, setStock] = useState('');
  const [dimention, setDimention] = useState('');
  const [price, setPrice] = useState('');
  const [orders, setOrders] = useState([]);

  const adminId = useSelector(state => state.user.id);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.post('http://localhost:3000/api/v1/order/admin/get-orders', {}, {
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

  const createWarehouse = async () => {
    try {
      const response = await axios.post('http://localhost:3000/api/v1/admins/createWarehouse', { name: warehouseName, location: locale, admin: adminId }, {
        withCredentials: true
      });
      if (response.status === 200) {
        alert('Warehouse created successfully');
      }
    } catch (error) {
      console.error('Error creating warehouse:', error);
    }
    setLocale('');
    setWarehouseName('');
  };

  const addProduct = async () => {
    try {
      const response = await axios.post('http://localhost:3000/api/v1/admins/addProduct', { name, stock, dimentions: dimention, price }, {
        withCredentials: true
      });
      if (response.status === 200) {
        alert('Product added successfully');
      }
    } catch (error) {
      console.error('Error adding product:', error);
    }
    setDimention('');
    setName('');
    setPrice('');
    setStock('');
  };

  const completeOrder = async (orderId) => {
    console.log("Completing order")
    try {
      const response = await axios.post('http://localhost:3000/api/v1/order/complete-order', { order_id: orderId }, {
        withCredentials: true
      });
      if (response.status === 200) {
        setOrders(prevOrders => prevOrders.map(order => order._id === orderId ? { ...order, status: 'shipped' } : order));
        alert('Order completed successfully');
      }
    } catch (error) {
      console.error('Error completing order:', error);
    }
  };

  return (
    <div className='flex flex-row'>
      <div className='w-1/2 p-4'>
        <h1 className='text-3xl mb-4'>Orders</h1>
        {orders.map(order => (
          <div key={order._id} className='border-2 rounded-2xl p-4 mb-4'>
            <h2 className='text-xl'>Order ID: {order._id}</h2>
            <p>Product: {order.product}</p>
            <p>Customer: {order.customer}</p>
            <p>Status: {order.status}</p>
            <Button func={() => completeOrder(order._id)} command={"Complete Order"} />
          </div>
        ))}
      </div>

      <div className='ml-auto w-1/2 p-4'>
        <div className='text-center border-2 rounded-2xl border-white bg-gray-950 w-[400px] h-[300px] flex flex-col justify-center items-center gap-6 text-white mb-4'>
          <h1 className='text-5xl'>Create Warehouse</h1>
          <div className='flex flex-col gap-2'>
            <input type='text' value={locale} className='border-2 rounded-2xl h-auto p-2' placeholder='locale' onChange={e => setLocale(e.target.value)} />
            <input type='text' value={warehouseName} className='border-2 rounded-2xl h-auto p-2' placeholder='name' onChange={e => setWarehouseName(e.target.value)} />
          </div>
          <Button func={createWarehouse} command={"Create"} />
        </div>

        <div className='text-center border-2 rounded-2xl border-white bg-gray-950 w-[400px] h-[500px] flex flex-col justify-center items-center gap-6 text-white'>
          <h1 className='text-5xl'>Create Product</h1>
          <div className='flex flex-col gap-2'>
            <input type='text' value={name} className='border-2 rounded-2xl h-auto p-2' placeholder='name' onChange={e => setName(e.target.value)} />
            <input type='text' value={stock} className='border-2 rounded-2xl h-auto p-2' placeholder='stock' onChange={e => setStock(e.target.value)} />
            <input type='text' value={dimention} className='border-2 rounded-2xl h-auto p-2' placeholder='dimention' onChange={e => setDimention(e.target.value)} />
            <input type='text' value={price} className='border-2 rounded-2xl h-auto p-2' placeholder='price' onChange={e => setPrice(e.target.value)} />
          </div>
          <div className='h-[50px]'>
            <Button func={addProduct} command={"Create"} />

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;