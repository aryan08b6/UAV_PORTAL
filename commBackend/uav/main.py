import asyncio
import json
import socketio
import cv2
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCConfiguration, RTCIceServer, RTCIceCandidate
from aiortc.contrib.media import MediaStreamTrack
from aiortc.rtcrtpsender import RTCRtpSender
from av import VideoFrame
import re


# FOR CONVERTION OF CANDIDATE STRING TO DICTIONARY
def parse_candidate(candidate_str):
    """
    Parses a WebRTC SDP candidate string into parameters for RTCIceCandidate.
    """
    candidate_regex = re.compile(
        r"candidate:(?P<foundation>\d+) (?P<component>\d+) (?P<protocol>\S+) (?P<priority>\d+) "
        r"(?P<ip>[0-9\.]+) (?P<port>\d+) typ (?P<type>\S+)"
        r"(?: raddr (?P<relatedAddress>[0-9\.]+) rport (?P<relatedPort>\d+))?"
        r"(?: tcptype (?P<tcpType>\S+))?"
    )

    match = candidate_regex.match(candidate_str)
    if not match:
        raise ValueError("Invalid ICE candidate format")

    return match.groupdict()


#WEB_RTC CONFIG
ICE_SERVERS = [RTCIceServer(urls="stun:stun1.l.google.com:19302"), RTCIceServer(urls="stun:stun2.l.google.com:19302")]
peer = RTCPeerConnection(RTCConfiguration(iceServers=ICE_SERVERS))


#SOCKET_IO CONFIG
sio = socketio.AsyncClient()
user_sid = None


#VIDEO TRACK
class VideoTrack(MediaStreamTrack):
    kind = "video"

    def __init__(self):
        super().__init__()
        self.cap = cv2.VideoCapture(0)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 320)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 240)
        self.frame_ready = asyncio.Event()
        self.current_frame = None
        self.task = asyncio.create_task(self.capture_frames())

    async def capture_frames(self):
        """Continuously capture frames."""
        while True:
            ret, frame = self.cap.read()
            if ret:
                self.current_frame = VideoFrame.from_ndarray(frame, format="bgr24")
                self.frame_ready.set()
            await asyncio.sleep(1)

    async def recv(self):
        """Send the latest frame when requested."""
        await self.frame_ready.wait()
        self.frame_ready.clear()
        print("working")
        if self.current_frame:
            self.current_frame.pts, self.current_frame.time_base = await self.next_timestamp()
            print("📷 Sending frame")
            return self.current_frame
        return None


#HANDLING ICE CANDIDATES
@sio.on("ice_candidates")
async def update_ice_candidate(data):
    for ice_candidate_data in data['ice_candidates']:
        if not ice_candidate_data:
            print("⚠️ No ICE candidate data found!")
            continue

        candidate_str = ice_candidate_data.get("candidate")
        sdp_mid = ice_candidate_data.get("sdpMid")
        sdp_mline_index = ice_candidate_data.get("sdpMLineIndex")
        username_fragment = ice_candidate_data.get("usernameFragment")

        if not candidate_str:
            print("⚠️ No candidate string found in the received data!")
            continue

        try:
            parsed = parse_candidate(candidate_str)
            candidate = RTCIceCandidate(
                component=int(parsed["component"]),
                foundation=parsed["foundation"],
                protocol=parsed["protocol"],
                priority=int(parsed["priority"]),
                ip=parsed["ip"],
                port=int(parsed["port"]),
                type=parsed["type"],
                relatedAddress=parsed.get("relatedAddress"),
                relatedPort=int(parsed["relatedPort"]) if parsed.get("relatedPort") else None,
                sdpMid=sdp_mid,
                sdpMLineIndex=int(sdp_mline_index),
                tcpType=parsed.get("tcpType")
            )
            await peer.addIceCandidate(candidate)
            print("✅ ICE Candidate added successfully!")
        except ValueError as e:
            print(f"❌ Error parsing ICE candidate: {e}")


#ESTABLISHING CONNECTION 
#HANDLING SDP OFFER AND CREATING ANSWER
@sio.on("establish_connection")
async def handle_connection(data):
    print("GOT REQUEST")
    
    global user_sid
    user_sid = data["user_sid"]
    sdp_offer = RTCSessionDescription(data["sdp_offer"]["sdp"], data["sdp_offer"]["type"])
    
    await peer.setRemoteDescription(sdp_offer)

    def force_codec(peer, forced_codec="video/VP8"):
        kind = forced_codec.split("/")[0]
        codecs = RTCRtpSender.getCapabilities(kind).codecs
        for transceiver in peer.getTransceivers():
            if transceiver.sender and transceiver.kind == kind:
                transceiver.setCodecPreferences([codec for codec in codecs if codec.mimeType == forced_codec])

    force_codec(peer)
    video_track = VideoTrack()
    peer.addTrack(video_track)
    print("Added video track")

    answer = await peer.createAnswer()
    await peer.setLocalDescription(answer)

    await sio.emit("complete_connection", {
        "uav_sid": sio.get_sid(),
        "sdp_answer": {
            "sdp": peer.localDescription.sdp,
            "type": peer.localDescription.type
        },
        "user_sid": user_sid
    })

    print("✅ Sent WebRTC Answer")

@peer.on("icegatheringstatechange")
async def on_ice_gathering_state_change():
    print(f"📡 ICE Gathering State: {peer.iceGatheringState}")

@peer.on("iceconnectionstatechange")
async def on_ice_state_change():
    print(f"🚦 ICE State Changed: {peer.iceConnectionState}")


async def main():
    await sio.connect('http://localhost:3000', auth={"type": "uav", "id": "uav123"})
    print("✅ Connected to Server")
    await sio.wait()

asyncio.run(main())