import React from 'react'
import Button from './Button'
import { useState } from 'react'
import axios from 'axios'

const Signup = () => {

  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [email, setEmail] = useState('')


  const signup = async () => {
    if (password === confirmPassword
      && password.length > 0
      && username.length > 0
      && fullName.length > 0
      && email.length > 0) {
      console.log('signup')
      const data = {
        fullName: fullName,
        username: username,
        password: password,
        email: email
      }
      try {
        const response = await axios.post('http://localhost:3000/api/v1/users/register', data);
        if (response.status === 201) {
          window.location.href = '/dashboard';
        } else {
          alert('Signup failed, please try again');
        }
      } catch (error) {
        alert('PLease enter all the details')
      }

    }
    else {
      console.log('error')
    }

  }

  return (
    <div className=' border-2 rounded-2xl border-white bg-gray-950 w-[400px] h-[600px] flex flex-col justify-center items-center gap-6 text-white'>
      <h1 className='text-5xl'> Sign Up </h1>
      <div className='flex flex-col gap-2'>
        <input type='email' className='border-2 rounded-2xl h-auto p-2 ' placeholder='email' onChange={e => setEmail(e.target.value)} />
        <input type='text' className='border-2 rounded-2xl h-auto p-2' placeholder='username' onChange={e => setUsername(e.target.value)} />
        <input type='text' className='border-2 rounded-2xl h-auto p-2' placeholder='full name' onChange={e => setFullName(e.target.value)} />
        <input type='text' className='border-2 rounded-2xl h-auto p-2' placeholder='password' onChange={e => setPassword(e.target.value)} />
        <input type='text' className='border-2 rounded-2xl h-auto p-2' placeholder='confirm password' onChange={e => setConfirmPassword(e.target.value)} />
      </div>
      <div className='h-[50px]'>
        <Button func={signup} command={"Signup"} />

      </div>    </div>
  )
}

export default Signup
