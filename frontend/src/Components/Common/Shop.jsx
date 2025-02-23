import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { addItem } from '../../redux/slices/cartSlice';
import Button from './Button';

const Shop = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.post('http://localhost:3000/api/v1/order/getProducts');
        setProducts(response.data.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, []);


  const dispatch = useDispatch();
  const addToCart = (productId, productName) => {
    // Implement add to cart logic here
    console.log(`Product ${productId} ${productName} added to cart`);
    dispatch(addItem({ productId, productName }));
  };

  return (

    <div className="relative w-screen">
      <div className={`flex flex-wrap`}>
        <div className='w-full p-4'>
          <h1 className='text-3xl mb-4'>Products</h1>
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
            {products.map(product => (
              <div key={product._id} className='flex flex-col justify-between items-center border-2 h-60 w-auto rounded-2xl p-4'>
                <div className='flex flex-col items-center justify-center'>
                  <h2 className='text-xl'>{product.name}</h2>
                </div>
                <div>
                <p>Stock: {product.stock}</p>
                <p>Price: ${product.price}</p>
                </div>

                <div className='flex flex-row items-center justify-between'>
                  <Button func={() => addToCart(product._id, product.name)} command={"Add To Cart"} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;