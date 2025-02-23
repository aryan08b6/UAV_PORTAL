import React, { useState, useEffect, useRef } from 'react';
import Button from '../Common/Button';
import axios from 'axios';
import ControlModal from './ControlModal';
import ChangePasswordModal from './ChangePasswordModal';
import ChangeNameModal from './ChangeNameModal';
import io from 'socket.io-client'

const peerConnectionConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
};

const peerConnection = new RTCPeerConnection(peerConnectionConfig)
peerConnection.addTransceiver("video", { direction: "recvonly" })

const socket = io("http://localhost:5000", {
  auth: { type: "user", id: "user1234" },
});

const UserDashboard = () => {
  const [uavs, setUavs] = useState([]);
  const [selectedUav, setSelectedUav] = useState(null);
  const [modalName, setModalName] = useState("none");
  const [password, setPassword] = useState("");
  const [newName, setNewName] = useState("");
  const uavFeedRef = useRef(null);
  const [uavSID, setUavSID] = useState("")
  const [iceCandidates, setIceCandidates] = useState([])


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

    socket.on("connect", () => {
      console.log("Connected to server")
    })

    socket.on("disconnect", () => {
      console.log("Disconnected from server")
    })

    socket.on("complete_connection", async (data) => {
      console.log("2. Got SDP Answer", data)
      setUavSID(data.uav_sid)
      await peerConnection.setRemoteDescription(data.sdp_answer)
      console.log("3. Added SDP Answer")

      console.log(`Sending ICE Candidates ${iceCandidates.length}`)

      setIceCandidates((prevItems) => {
        console.log("Sending ICE Candidate", prevItems.length)
        socket.emit("ice_candidates", { target_sid: data.uav_sid, ice_candidates: prevItems })
        return []
      })

      console.log("SENT ICE Candidates")
    })

    peerConnection.ontrack = (event) => {
      console.log("Received video track from UAV");
      if (uavFeedRef.current) {
        uavFeedRef.current.srcObject = event.streams[0];
      }
    };

    peerConnection.onicecandidate = (event) => {
      if (event.candidate === null || event.candidate.candidate === "") {
        return;
      }

      setIceCandidates((prevItems) => {
        if (uavSID !== "" && prevItems.length > 9) {
          console.log("Sending ICE Candidate", prevItems.length)
          socket.emit("ice_candidates", { target_sid: data.uav_sid, ice_candidates: prevItems })
          return []
        } else {
          const newCandidates = [...prevItems, event.candidate];
          return newCandidates;
        }
      })
    }

    return () => socket.disconnect();
  }, [])

  const establish_connection = async (uav) => {
    console.log("1. Sending Offer")
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    try{
      console.log("1. Sending Offer")
      socket.emit("establish_connection", { uav_id: uav._id, sdp_offer: offer })
    } catch (error) {
      console.log(error)
      alert("UAV is not connected")
      closeModal()
    }
  }

  const send_command = (command) => {
    socket.emit("send_command", { uav_sid: uavSID, command })
  }




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
                  <Button func={() => connect(uav)} command={"Connect"} />
                  <Button func={() => activateName(uav)} command={"Change Name"} />
                  <Button func={() => activatePassword(uav)} command={"Change Password"} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modalName == "connect" && (
        ControlModal(selectedUav, closeModal, uavFeedRef)
      )}
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