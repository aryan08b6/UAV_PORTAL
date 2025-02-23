import React from 'react'
import Button from './Button'
import { useState } from 'react'
import axios from 'axios'

const Login = () => {

  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')


  const loginFn = async () => {
    if (password.length > 0
      && email.length > 0) {
      console.log('signup')
      const data = {
        password: password,
        email: email
      }
      try {
        const response = await axios.post('http://localhost:3000/api/v1/users/login', data, {
          withCredentials: true
        });
        if (response.status === 200) {
          window.location.href = '/dashboard';
          console.log(response)
        } else {
          console.log(response)
          alert('Signup failed, please try again');
        }
      } catch (error) {
        alert('PLease enter all the details',)
        console.log(error)
      }

    }
    else {
      console.log('error')
    }
  }

  return (
    <div className=' border-2 rounded-2xl border-white bg-gray-950 w-[400px] h-[600px] flex flex-col justify-center items-center gap-6 text-white'>
      <h1 className='text-5xl'> Log In </h1>
      <div className='flex flex-col gap-2'>
        <input type='email' className='border-2 rounded-2xl h-auto p-2 ' placeholder='email' onChange={e => setEmail(e.target.value)} />
        <input type='text' className='border-2 rounded-2xl h-auto p-2' placeholder='password' onChange={e => setPassword(e.target.value)} />
      </div>
      <div className='h-[50px]'>
        <Button func={loginFn} command={"Login"} />

      </div>
    </div>
  )
}

export default Login
