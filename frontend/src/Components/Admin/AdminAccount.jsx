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

  return (
    <div>
      <Button func={logout} command={"Logout"}>
        Logout
      </Button>

    </div>
  )
}

export default Account
