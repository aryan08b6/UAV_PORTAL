import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { removeItem, clearCart } from '../../redux/slices/cartSlice';


const Cart = () => {
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart.items);
  const user = useSelector((state) => state.user);
  const [locale, setLocale] = useState('');

  const handleRemoveItem = (id) => {
    dispatch(removeItem(id));
  };

  const handleClearCart = () => {
    dispatch(clearCart());
  };

  const submit = async () => {
    console.log('submitting cart');
    const data = {
      cartItems,
      customer: user.id,
      locale,
    };
    console.log(data)


    try {
      const response = await axios.post('http://localhost:3000/api/v1/order/create-orders', data, {
        withCredentials: true,
      });
      if (response.status === 200) {
        alert('Order created successfully');
        dispatch(clearCart());
      }
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  return (
    <div>
      {cartItems.length > 0 ? (
        <div>
          <ul>
            {cartItems.map((item) => (
              <li key={item.id}>
                <div className='flex flex-row items-center gap-4'>
                  {item.name} - {item.quantity}
                  <button className='h-[50px] w-[100px] border-black border-2 rounded-2xl' onClick={() => handleRemoveItem(item.id)}>Subtract</button>
                </div>
              </li>
            ))}
          </ul>
          <button className='h-[50px] w-[100px] border-black border-2 rounded-2xl' onClick={handleClearCart}>Clear Cart</button>
          <div>
            <label htmlFor="locale">Locale:</label>
            <input
              type="text"
              id="locale"
              value={locale}
              onChange={(e) => setLocale(e.target.value)}
              className='border-2 rounded-2xl h-auto p-2'
            />
          </div>
          <button className='h-[50px] w-[100px] border-black border-2 rounded-2xl' onClick={submit}>Make Order</button>
        </div>
      ) : (
        <p>Your cart is empty</p>
      )}
    </div>
  );
};

export default Cart;