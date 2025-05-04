import React, { useRef, useState, useEffect } from 'react'
import io from 'socket.io-client'
import { useParams } from 'react-router-dom';
import Button from '../Common/Button';
import { useNavigate } from 'react-router-dom';


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


const ControlPanel = () => {
  const uavFeedRef = useRef(null);
  const [uavSID, setUavSID] = useState("")
  const [iceCandidates, setIceCandidates] = useState([])
  const { id, name } = useParams();
  const [barometer, setBarometer] = useState(0)
  const [voltage, setVoltage] = useState(0)
  const [ultrasonic, setUltrasonic] = useState(0)
  const [velocity, setVelocity] = useState(0)
  const [yaw, setYaw] = useState(0);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
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

    socket.on("command_status", (data) => {
      const { status } = data
      console.log("Command Status", status)
      setBarometer(status.altitude)
      setVoltage(status.voltage)
      setUltrasonic(status.ultra)
      setVelocity(status.velocity)
      setYaw(status.yaw)
      setX(status.x)
      setY(status.y)
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

    const establishConnection = async () => {
      try {
        console.log('1. Sending Offer');
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        socket.emit('establish_connection', {
          uav_id: id,
          sdp_offer: offer,
        });
      } catch (error) {
        console.error('Error establishing connection:', error);
        alert('UAV is not connected');
      }
    };

    establishConnection();

    return () => socket.disconnect();
  }, [])

  const close = () => {
    socket.close()
    peerConnection.close()
    navigate("/dashboard")
  }

  const handleCommand = (command) => {
    socket.emit("command", {
      command,
      uav_sid: uavSID
    })
  }

  return (
    <div className='fixed inset-0 flex items-center justify-center bg-transparent '>
      <div className='text-white bg-gray-800 p-4 rounded-2xl h-4/5 w-4/5 flex flex-col justify-between'>
        <div>
          <h2 className='text-xl mb-4'>{name}</h2>
          <p>Connecting to UAV ID: {id}</p>
        </div>
        <div className='flex flex-row items-center justify-evenly'>
        <video ref={uavFeedRef} autoPlay playsInline className="m-5 bg-black w-[640px] h-[480px]" />
        <div>
          <div className='flex flex-col items-center border-2 border-white rounded-lg p-4'>
          <h1>
            Barometer Height {barometer}
          </h1>
          <h1>
            Ultrasonic Height {ultrasonic}
          </h1>
          <h1>
            Voltage {voltage}
          </h1>
          <h1>
            Velocity {velocity}
          </h1>
          <h1>
            yaw {yaw}
          </h1>
          <h1>
            X {x}
          </h1>
          <h1>
            Y {y}
          </h1>
          </div>
        </div>
        </div>

        <div className='flex gap-4 justify-center'>
          <Button func={() => { handleCommand("TakeOff") }} command={"Take OFF"} />
          <Button func={() => { handleCommand("Stop") }} command={"AUTONOMOUS"} />
          <Button func={close} command={"Close"} />

        </div>
      </div>

    </div >
  )
}

export default ControlPanel
