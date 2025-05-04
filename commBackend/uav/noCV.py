import asyncio
import json
import socketio
import cv2
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCConfiguration, RTCIceServer
from aiortc.contrib.media import MediaPlayer, MediaRelay
from pymavlink import mavutil
import time
import threading
import os
import platform

# UAV configuration
id = "67ba20f1d6575faf3a020e2a"
password = "uavPassword"

relay = None
webcam = None
master = mavutil.mavlink_connection('/dev/ttyACM0', baud=57600)

user_sid = None

# Initialize a shared variable for vehicle status
vehicle_status = {
    "altitude": 0.0,
    "voltage": 0.0
}

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

# Separate thread to update vehicle status
def update_vehicle_status():
    global vehicle_status

    while True:
        try:
            # Get current status from MAVLink
            msg = master.recv_match(type='GLOBAL_POSITION_INT', blocking=True, timeout=1)
            if msg:
                altitude = msg.relative_alt / 1000.0  # in meters
                voltage_msg = master.recv_match(type='SYS_STATUS', blocking=True, timeout=1)
                voltage = voltage_msg.voltage_battery if voltage_msg else 0.0

                # Update shared vehicle status
                vehicle_status['altitude'] = altitude
                vehicle_status['voltage'] = voltage
                print(f"Vehicle Status - Altitude: {altitude} m, Voltage: {voltage} V")

        except Exception as e:
            print(f"Error updating vehicle status: {e}")
        
        # Wait for 5 seconds before the next update
        time.sleep(5)

# Socket.IO event for sending the command status
async def send_vehicle_status():
    global vehicle_status, user_sid

    while True:
        # Send status data to the user
        if user_sid:
            await sio.emit("command_status", {
                "user_sid": user_sid,
                "status": {
                    "altitude": vehicle_status["altitude"],
                    "voltage": vehicle_status["voltage"]
                }
            })
        await asyncio.sleep(5)  # Delay next send by 5 seconds

# Socket.IO Client Setup
sio = socketio.AsyncClient()

@sio.on("establish_connection")
async def handle_connection(data):
    global user_sid
    user_sid = data["user_sid"]
    sdp_offer = RTCSessionDescription(data["sdp_offer"]["sdp"], data["sdp_offer"]["type"])
    
    peer = RTCPeerConnection(RTCConfiguration(iceServers=[RTCIceServer(urls="stun:stun1.l.google.com:19302")]))
    await peer.setRemoteDescription(sdp_offer)

    audio, video = create_local_tracks(play_from=None, decode=False)
    video_sender = peer.addTrack(video)

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

# Main entry point
async def main():
    await sio.connect('http://localhost:5000', auth={"type": "uav", "id": id})
    print("✅ Connected to Server")
    
    # Start vehicle status update in a separate thread
    status_thread = threading.Thread(target=update_vehicle_status, daemon=True)
    status_thread.start()

    # Start sending vehicle status updates asynchronously
    await asyncio.gather(
        send_vehicle_status(),
        sio.wait()
    )

# Run the main async loop
if __name__ == "__main__":
    asyncio.run(main())


# import asyncio
# import json
# import socketio
# import cv2
# from aiortc import RTCPeerConnection, RTCSessionDescription, RTCConfiguration, RTCIceServer, RTCIceCandidate
# from aiortc.contrib.media import MediaStreamTrack
# from aiortc.rtcrtpsender import RTCRtpSender
# from av import VideoFrame
# import re
# import platform
# from aiortc import RTCPeerConnection, RTCSessionDescription
# from aiortc.contrib.media import MediaPlayer, MediaRelay
# from aiortc.rtcrtpsender import RTCRtpSender
# from pymavlink import mavutil
# import time
# import argparse
# import asyncio
# import json
# import logging
# import os
# import platform
# import ssl
# from aiohttp import web
# from aiortc import RTCPeerConnection, RTCSessionDescription
# from aiortc.contrib.media import MediaPlayer, MediaRelay
# from aiortc.rtcrtpsender import RTCRtpSender
# import threading

# ROOT = os.path.dirname(__file__)

# id = "67ba20f1d6575faf3a020e2a"
# password = "uavPassword"

# relay = None
# webcam = None

# master = mavutil.mavlink_connection('/dev/ttyACM0', baud=57600)

# user_sid = None

# # Initialize a shared variable for vehicle status
# vehicle_status = {
#     "altitude": 0.0,
#     "voltage": 0.0
# }

# def create_local_tracks(play_from, decode):
#     global relay, webcam

#     if play_from:
#         player = MediaPlayer(play_from, decode=decode)
#         return player.audio, player.video
#     else:
#         options = {"framerate": "30", "video_size": "640x480"}
#         if relay is None:
#             if platform.system() == "Darwin":
#                 webcam = MediaPlayer(
#                     "default:none", format="avfoundation", options=options
#                 )
#             elif platform.system() == "Windows":
#                 webcam = MediaPlayer(
#                     "video=Integrated Camera", format="dshow", options=options
#                 )
#             else:
#                 webcam = MediaPlayer("/dev/video0", format="v4l2", options=options)
#             relay = MediaRelay()
#         return None, relay.subscribe(webcam.video)

# # Separate thread to update vehicle status
# def update_vehicle_status():
#     global vehicle_status

#     while True:
#         try:
#             # Get current status from MAVLink
#             msg = master.recv_match(type='GLOBAL_POSITION_INT', blocking=True, timeout=1)
#             if msg:
#                 altitude = msg.relative_alt / 1000.0  # in meters
#                 voltage_msg = master.recv_match(type='SYS_STATUS', blocking=True, timeout=1)
#                 voltage = voltage_msg.voltage_battery if voltage_msg else 0.0

#                 # Update shared vehicle status
#                 vehicle_status['altitude'] = altitude
#                 vehicle_status['voltage'] = voltage
#                 print(f"Vehicle Status - Altitude: {altitude} m, Voltage: {voltage} V")

#         except Exception as e:
#             print(f"Error updating vehicle status: {e}")
        
#         # Wait for 5 seconds before the next update
#         time.sleep(5)

# # Socket.IO event for sending the command status
# async def send_vehicle_status():
#     global vehicle_status, user_sid

#     while True:
#         # Send status data to the user
#         if user_sid:
#             await sio.emit("command_status", {
#                 "user_sid": user_sid,
#                 "status": {
#                     "altitude": vehicle_status["altitude"],
#                     "voltage": vehicle_status["voltage"]
#                 }
#             })
#         await asyncio.sleep(5)  # Delay next send by 5 seconds

# # Socket.IO Client Setup
# sio = socketio.AsyncClient()

# @sio.on("establish_connection")
# async def handle_connection(data):
#     global user_sid
#     user_sid = data["user_sid"]
#     sdp_offer = RTCSessionDescription(data["sdp_offer"]["sdp"], data["sdp_offer"]["type"])
    
#     peer = RTCPeerConnection(RTCConfiguration(iceServers=[RTCIceServer(urls="stun:stun1.l.google.com:19302")]))
#     await peer.setRemoteDescription(sdp_offer)

#     audio, video = create_local_tracks(play_from=None, decode=False)
#     video_sender = peer.addTrack(video)

#     answer = await peer.createAnswer()
#     await peer.setLocalDescription(answer)

#     await sio.emit("complete_connection", {
#         "uav_sid": sio.get_sid(),
#         "sdp_answer": {
#             "sdp": peer.localDescription.sdp,
#             "type": peer.localDescription.type
#         },
#         "user_sid": user_sid
#     })

#     print("✅ Sent WebRTC Answer")

# # Main entry point
# async def main():
#     await sio.connect('http://localhost:5000', auth={"type": "uav", "id": id})
#     print("✅ Connected to Server")
    
#     # Start vehicle status update in a separate thread
#     status_thread = threading.Thread(target=update_vehicle_status, daemon=True)
#     status_thread.start()

#     # Start sending vehicle status updates asynchronously
#     await asyncio.gather(
#         send_vehicle_status(),
#         sio.wait()
#     )

# asyncio.run(main())



# import asyncio
# import json
# import socketio
# import cv2
# from aiortc import RTCPeerConnection, RTCSessionDescription, RTCConfiguration, RTCIceServer, RTCIceCandidate
# from aiortc.contrib.media import MediaStreamTrack
# from aiortc.rtcrtpsender import RTCRtpSender
# from av import VideoFrame
# import re
# import platform
# from aiortc import RTCPeerConnection, RTCSessionDescription
# from aiortc.contrib.media import MediaPlayer, MediaRelay
# from aiortc.rtcrtpsender import RTCRtpSender
# from pymavlink import mavutil
# import time
# import argparse
# import asyncio
# import json
# import logging
# import os
# import platform
# import ssl
# from aiohttp import web
# from aiortc import RTCPeerConnection, RTCSessionDescription
# from aiortc.contrib.media import MediaPlayer, MediaRelay
# from aiortc.rtcrtpsender import RTCRtpSender

# ROOT = os.path.dirname(__file__)


# id = "67ba20f1d6575faf3a020e2a"
# password = "uavPassword"

# relay = None
# webcam = None

# master = mavutil.mavlink_connection('/dev/ttyACM1', baud=57600)

# def create_local_tracks(play_from, decode):
#     global relay, webcam

#     if play_from:
#         player = MediaPlayer(play_from, decode=decode)
#         return player.audio, player.video
#     else:
#         options = {"framerate": "30", "video_size": "640x480"}
#         if relay is None:
#             if platform.system() == "Darwin":
#                 webcam = MediaPlayer(
#                     "default:none", format="avfoundation", options=options
#                 )
#             elif platform.system() == "Windows":
#                 webcam = MediaPlayer(
#                     "video=Integrated Camera", format="dshow", options=options
#                 )
#             else:
#                 webcam = MediaPlayer("/dev/video0", format="v4l2", options=options)
#             relay = MediaRelay()
#         return None, relay.subscribe(webcam.video)


# def force_codec(pc, sender, forced_codec):
#     kind = forced_codec.split("/")[0]
#     codecs = RTCRtpSender.getCapabilities(kind).codecs
#     transceiver = next(t for t in pc.getTransceivers() if t.sender == sender)
#     transceiver.setCodecPreferences(
#         [codec for codec in codecs if codec.mimeType == forced_codec]
#     )




# # FOR CONVERTION OF CANDIDATE STRING TO DICTIONARY
# def parse_candidate(candidate_str):
#     """
#     Parses a WebRTC SDP candidate string into parameters for RTCIceCandidate.
#     """
#     candidate_regex = re.compile(
#         r"candidate:(?P<foundation>\d+) (?P<component>\d+) (?P<protocol>\S+) (?P<priority>\d+) "
#         r"(?P<ip>[0-9\.]+) (?P<port>\d+) typ (?P<type>\S+)"
#         r"(?: raddr (?P<relatedAddress>[0-9\.]+) rport (?P<relatedPort>\d+))?"
#         r"(?: tcptype (?P<tcpType>\S+))?"
#     )

#     match = candidate_regex.match(candidate_str)
#     if not match:
#         raise ValueError("Invalid ICE candidate format")

#     return match.groupdict()


# #WEB_RTC CONFIG
# ICE_SERVERS = [RTCIceServer(urls="stun:stun1.l.google.com:19302"), RTCIceServer(urls="stun:stun2.l.google.com:19302")]
# peer = RTCPeerConnection(RTCConfiguration(iceServers=ICE_SERVERS))


# #SOCKET_IO CONFIG
# sio = socketio.AsyncClient()
# user_sid = None


# #HANDLING ICE CANDIDATES
# @sio.on("ice_candidates")
# async def update_ice_candidate(data):
#     for ice_candidate_data in data['ice_candidates']:
#         if not ice_candidate_data:
#             print("⚠️ No ICE candidate data found!")
#             continue

#         candidate_str = ice_candidate_data.get("candidate")
#         sdp_mid = ice_candidate_data.get("sdpMid")
#         sdp_mline_index = ice_candidate_data.get("sdpMLineIndex")
#         username_fragment = ice_candidate_data.get("usernameFragment")

#         if not candidate_str:
#             print("⚠️ No candidate string found in the received data!")
#             continue

#         try:
#             parsed = parse_candidate(candidate_str)
#             candidate = RTCIceCandidate(
#                 component=int(parsed["component"]),
#                 foundation=parsed["foundation"],
#                 protocol=parsed["protocol"],
#                 priority=int(parsed["priority"]),
#                 ip=parsed["ip"],
#                 port=int(parsed["port"]),
#                 type=parsed["type"],
#                 relatedAddress=parsed.get("relatedAddress"),
#                 relatedPort=int(parsed["relatedPort"]) if parsed.get("relatedPort") else None,
#                 sdpMid=sdp_mid,
#                 sdpMLineIndex=int(sdp_mline_index),
#                 tcpType=parsed.get("tcpType")
#             )
#             await peer.addIceCandidate(candidate)
#             print("✅ ICE Candidate added successfully!")
#         except ValueError as e:
#             print(f"❌ Error parsing ICE candidate: {e}")
# @sio.on("command")
# async def handle_command(data):
#     command = data['command']
#     print(f"Received command: {command}")
#     if command == "TakeOff":
#         master.set_mode_apm('ALT_HOLD')
#         print("Mode set to ALTHOLD")


#         # Arm the drone
#         master.arducopter_arm()
#         print("Arming...")
#         master.motors_armed_wait()
#         print("Drone armed")


#         #
#         master.mav.rc_channels_override_send(
#         master.target_system,
#         master.target_component,
#         0, 0, 1300, 0, 0, 0, 0, 0
#         )
#         time.sleep(5)


#         while True:
#             # Request altitude data
#             master.mav.request_data_stream_send(
#                 master.target_system,
#                 master.target_component,
#                 mavutil.mavlink.MAV_DATA_STREAM_POSITION,
#                 1, 1
#             )
            
#             # Wait for the drone to reach the target altitude

#             # Read messages to get altitude
#             msg = master.recv_match(type='GLOBAL_POSITION_INT', blocking=True, timeout=1)
#             time.sleep(0.1)
#             if msg:
#                 current_alt = msg.relative_alt / 1000.0  # in meters


#                 # Stop ramping throttle once target altitude reached
#                 if current_alt >= 11:
#                     print("Target altitude reached")
#                     master.mav.rc_channels_override_send(
#                     master.target_system,
#                     master.target_component,
#                     0, 0, 1500, 0, 0, 0, 0, 0
#                     )
#                     time.sleep(15)
#                     while True:
#                         msg = master.recv_match(type='SYS_STATUS', blocking=True, timeout=1)
#                         if msg:
#                             voltage = msg.voltage_battery
#                         else:
#                             voltage = 0
#                         print("Sending data to user...")
#                         await sio.emit({"user_sid": user_sid, "command_data": {"bh": current_alt, "us": "0", "voltage": voltage}})
#                         current_alt = msg.relative_alt / 1000.0  # in meters
#                         print(f"Current Altitude: {current_alt:.2f} m")
#                         master.mav.rc_channels_override_send(
#                         master.target_system,
#                         master.target_component,
#                         0, 0, 1100, 0, 0, 0, 0, 0
#                         )
                        
#                         if current_alt <= 0.5:
#                             break
                        
#                         time.sleep(0.5)

#                     break

#             # Apply RC override to throttle (channel 3)
#             master.mav.rc_channels_override_send(
#                 master.target_system,
#                 master.target_component,
#                 0, 0, 1700, 0, 0, 0, 0, 0
#             )
#             time.sleep(0.5)


#         # Cleanup
#         master.mav.rc_channels_override_send(
#             master.target_system,
#             master.target_component,
#             0, 0, 0, 0, 0, 0, 0, 0
#         )
#         master.set_mode_apm('LAND')
#         print("Mode set to ALTHOLD")
#         master.arducopter_disarm()
#         print("RC override released. Drone is hovering at ALTHOLD.")


# #ESTABLISHING CONNECTION 
# #HANDLING SDP OFFER AND CREATING ANSWER
# @sio.on("establish_connection")
# async def handle_connection(data):
#     print("GOT REQUEST")
    
#     global user_sid
#     user_sid = data["user_sid"]
#     sdp_offer = RTCSessionDescription(data["sdp_offer"]["sdp"], data["sdp_offer"]["type"])
    
#     await peer.setRemoteDescription(sdp_offer)

#     audio, video = create_local_tracks(play_from=None, decode=False)
#     video_sender = peer.addTrack(video)

#     print("Added video track")

#     answer = await peer.createAnswer()
#     await peer.setLocalDescription(answer)

#     await sio.emit("complete_connection", {
#         "uav_sid": sio.get_sid(),
#         "sdp_answer": {
#             "sdp": peer.localDescription.sdp,
#             "type": peer.localDescription.type
#         },
#         "user_sid": user_sid
#     })

#     master.wait_heartbeat()
#     print("Heartbeat received from system (system %u component %u)" % (master.target_system, master.target_component))

#     print("✅ Sent WebRTC Answer")


# @peer.on("icegatheringstatechange")
# async def on_ice_gathering_state_change():
#     print(f"📡 ICE Gathering State: {peer.iceGatheringState}")

# @peer.on("iceconnectionstatechange")
# async def on_ice_state_change():
#     print(f"🚦 ICE State Changed: {peer.iceConnectionState}")


# async def main():
#     await sio.connect('http://localhost:5000', auth={"type": "uav", "id": id})
#     print("✅ Connected to Server")
#     await sio.wait()

# asyncio.run(main())