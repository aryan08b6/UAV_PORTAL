import React, { useState, useEffect, useRef, use } from 'react';
import Button from '../Common/Button';
import axios from 'axios';
import ChangePasswordModal from './ChangePasswordModal';
import ChangeNameModal from './ChangeNameModal';
import { useNavigate } from 'react-router-dom';

const UserDashboard = () => {
  const [uavs, setUavs] = useState([]);
  const [selectedUav, setSelectedUav] = useState(null);
  const [modalName, setModalName] = useState("none");
  const [password, setPassword] = useState("");
  const [newName, setNewName] = useState("");
  const navigate = useNavigate();


  const fetchOrders = async () => {
    try {
      const response = await axios.post('http://localhost:3000/api/v1/uav/get-uavs', {}, {
        withCredentials: true
      });
      setUavs(response.data.data);
      console.log(response.data.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [])

  const closeModal = () => {
    setSelectedUav(null);
    setModalName("none");
  };

  const connect = async (uav) => {
    setModalName("connect");
    setSelectedUav(uav);
    await establish_connection(uav);
  }

  const activateName = (uav) => {
    setNewName("")
    setModalName("changeName");
    setSelectedUav(uav);
  }


  const activatePassword = (uav) => {
    setPassword("")
    setModalName("changePassword");
    setSelectedUav(uav);
  }

  const changePassword = async () => {
    const response = await axios.post('http://localhost:3000/api/v1/uav/change-password', {
      password,
      uavID: selectedUav
    }, { withCredentials: true });
    await fetchOrders();
    if (response.status === 200) {
      alert("name Changed")
    }
    closeModal()
  }

  const changeName = async () => {
    console.log("Running")
    const response = await axios.post('http://localhost:3000/api/v1/uav/change-name', {
      name: newName,
      uavID: selectedUav
    }, { withCredentials: true });
    await fetchOrders();
    if (response.status === 200) {
      alert("name Changed")
    }
    closeModal()
  }

  return (
    <div className="relative w-screen">
      <div className={`flex flex-wrap ${modalName === "none" ? '' : 'blur-sm'}`}>
        <div className='w-full p-4'>
          <h1 className='text-3xl mb-4'>UAVS</h1>
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
            {uavs.map(uav => (
              <div key={uav._id} className='flex flex-col justify-between items-center border-2 h-60 w-auto rounded-2xl p-4'>
                <div className='flex flex-col items-center justify-center'>
                  <h2 className='text-xl'>UAV ID: {uav._id}</h2>
                  <h2 className='text-xl'>UAV Name : {uav.name}</h2>
                </div>

                <div className='flex flex-row items-center justify-between'>
                  <Button func={() => navigate(`/uav/${uav._id}/${uav.name}`)} command={"Connect"} />
                  <Button func={() => activateName(uav)} command={"Change Name"} />
                  <Button func={() => activatePassword(uav)} command={"Change Password"} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>


      {modalName == "changeName" && (
        ChangeNameModal(closeModal, newName, setNewName, changeName)
      )}
      {modalName == "changePassword" && (
        ChangePasswordModal(closeModal, password, setPassword, changePassword)
      )}
    </div>
  );
}


export default UserDashboard;