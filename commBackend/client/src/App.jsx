import React, { useEffect, useState, useRef } from 'react'
import io from 'socket.io-client'

const peerConnectionConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
};

const peerConnection = new RTCPeerConnection(peerConnectionConfig)
peerConnection.addTransceiver("video", { direction: "recvonly" })

const socket = io("http://localhost:3000", {
  auth: { type: "user", id: "user1234" },
});


const App = () => {
  const uavFeedRef = useRef(null);
  const [uavID, setUavID] = useState("")
  const [uavSID, setUavSID] = useState("")
  const [iceStatus, setIceStatus] = useState("new")
  const [iceCandidates, setIceCandidates] = useState([])

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

    peerConnection.oniceconnectionstatechange = (event) => {
      setIceStatus(peerConnection.iceConnectionState)
    }

    return () => socket.disconnect();
  }, [])

  const establish_connection = async () => {
    console.log("1. Sending Offer")
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit("establish_connection", { uav_id: uavID, sdp_offer: offer })
  }

  const send_command = (command) => {
    socket.emit("send_command", { uav_sid: uavSID, command })
  }

  return (
    <div className='flex flex-row w-full bg-gray-800 text-white'>
      <div className='h-screen flex flex-col items-center justify-center w-1/2'>

        <h1 className="text-5xl">UAV Connect</h1>

        <video ref={uavFeedRef} autoPlay playsInline className="m-5 bg-black w-[640px] h-[480px]" />

        <div className="flex flex-row items-center justify-evenly w-full">
          <button onClick={establish_connection} className="w-[200px] px-4 py-2 bg-black border-2 rounded-2xl transition-transform active:scale-95 active:opacity-80">
            Establish Connection
          </button>
          <input
            className="text-2xl h-10 w-60 text-cyan-300 bg-black rounded p-2"
            value={uavID}
            onChange={(e) => setUavID(e.target.value)}
            placeholder="UAV ID"
          />
        </div>

        <p className="text-lg mt-5">ICE Status: <span className="font-bold">{iceStatus}</span></p>

      </div>

      <div className='flex flex-col w-1/2 h-screen justify-center items-center gap-5'>
        {['ARM', 'DISARM', 'LAND', 'TAKEOFF', 'LOOP', 'ROTATE'].map((command) => (
          <button key={command} onClick={establish_connection} className="w-[200px] h-[50px] px-4 py-2 bg-black border-2 rounded-2xl transition-transform active:scale-95 active:opacity-80">
            {command}
          </button>
        ))}
      </div>
    </div>

  )
}

export default App
