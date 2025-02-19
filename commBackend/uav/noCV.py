import asyncio
import json
import socketio
import cv2
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCConfiguration, RTCIceServer, RTCIceCandidate
from aiortc.contrib.media import MediaStreamTrack
from aiortc.rtcrtpsender import RTCRtpSender
from av import VideoFrame
import re
import platform
from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaPlayer, MediaRelay
from aiortc.rtcrtpsender import RTCRtpSender

import argparse
import asyncio
import json
import logging
import os
import platform
import ssl

from aiohttp import web
from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaPlayer, MediaRelay
from aiortc.rtcrtpsender import RTCRtpSender

ROOT = os.path.dirname(__file__)


relay = None
webcam = None


def create_local_tracks(play_from, decode):
    global relay, webcam

    if play_from:
        player = MediaPlayer(play_from, decode=decode)
        return player.audio, player.video
    else:
        options = {"framerate": "30", "video_size": "640x480"}
        if relay is None:
            if platform.system() == "Darwin":
                webcam = MediaPlayer(
                    "default:none", format="avfoundation", options=options
                )
            elif platform.system() == "Windows":
                webcam = MediaPlayer(
                    "video=Integrated Camera", format="dshow", options=options
                )
            else:
                webcam = MediaPlayer("/dev/video0", format="v4l2", options=options)
            relay = MediaRelay()
        return None, relay.subscribe(webcam.video)


def force_codec(pc, sender, forced_codec):
    kind = forced_codec.split("/")[0]
    codecs = RTCRtpSender.getCapabilities(kind).codecs
    transceiver = next(t for t in pc.getTransceivers() if t.sender == sender)
    transceiver.setCodecPreferences(
        [codec for codec in codecs if codec.mimeType == forced_codec]
    )




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

    audio, video = create_local_tracks(play_from=None, decode=False)
    video_sender = peer.addTrack(video)

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