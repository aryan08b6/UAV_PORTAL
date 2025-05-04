import asyncio
import json
import socketio
import cv2
import os
import platform
import sys
import time
import threading
import numpy as np
from gpiozero import DistanceSensor
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCConfiguration, RTCIceServer, VideoStreamTrack
from aiortc.mediastreams import VideoFrame
from dronekit import connect, VehicleMode
import av

# Required if running in headless Linux environment
os.environ["QT_QPA_PLATFORM"] = "xcb"

# UAV Configuration
id = "67ba20f1d6575faf3a020e2a"
password = "uavPassword"

vehicle = connect('/dev/ttyACM0', baud=56700, wait_ready=True)
sensor = DistanceSensor(echo=24, trigger=23, max_distance=20)

sio = socketio.AsyncClient()

user_sid = None
ultasonic_altitude = sensor.distance * 100  # cm
x = 0
y = 0

vehicle_status = {
    "altitude": 0.0,
    "voltage": 0.0,
    "velocity": [0.0, 0.0, 0.0],
    "yaw": 0.0
}


def restart_program():
    print("🔁 Restarting UAV system...")
    python = sys.executable
    os.execv(python, [python] + sys.argv)


# OpenCV VideoStreamTrack with optical flow tracking
class CameraStreamTrack(VideoStreamTrack):
    def __init__(self):
        super().__init__()
        self.cap = cv2.VideoCapture(3)
        self.lk_params = dict(winSize=(15, 15),
                              maxLevel=2,
                              criteria=(cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 10, 0.03))
        ret, old_frame = self.cap.read()
        if not ret:
            raise RuntimeError("Failed to capture initial frame.")
        self.old_gray = cv2.cvtColor(old_frame, cv2.COLOR_BGR2GRAY)
        h, w = self.old_gray.shape
        self.initial_center = np.array([[[w // 2, h // 2]]], dtype=np.float32)
        self.tracking_point = self.initial_center.copy()
        self.mask = np.zeros_like(old_frame)
        self.lock = threading.Lock()

    async def recv(self):
        global x, y

        pts, time_base = await self.next_timestamp()
        ret, frame = self.cap.read()
        if not ret:
            await asyncio.sleep(0.01)
            return await self.recv()

        frame_gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        new_point, st, err = cv2.calcOpticalFlowPyrLK(
            self.old_gray, frame_gray, self.tracking_point, None, **self.lk_params
        )

        if new_point is not None and st[0][0] == 1:
            a, b = new_point.ravel()
            c, d = self.initial_center.ravel()

            self.mask = cv2.line(self.mask, (int(c), int(d)), (int(a), int(b)), (0, 255, 0), 2)
            frame = cv2.circle(frame, (int(a), int(b)), 5, (0, 0, 255), -1)

            sx = int(a - c)
            sy = int(b - d)

            with self.lock:
                x = sx
                y = sy

            self.tracking_point = new_point.copy()
        else:
            h, w = frame_gray.shape
            new_center = np.array([[[w // 2, h // 2]]], dtype=np.float32)
            self.tracking_point = new_center.copy()
            self.initial_center = new_center.copy()
            self.mask = np.zeros_like(frame)

        self.old_gray = frame_gray.copy()
        combined = cv2.add(frame, self.mask)
        combined = cv2.cvtColor(combined, cv2.COLOR_BGR2RGB)

        video_frame = VideoFrame.from_ndarray(combined, format="rgb24")
        video_frame.pts = pts
        video_frame.time_base = time_base
        return video_frame


def update_vehicle_status():
    global vehicle_status, ultasonic_altitude

    while True:
        try:
            altitude = vehicle.location.global_relative_frame.alt or 0.0
            voltage = vehicle.battery.voltage or 0.0
            velocity = vehicle.velocity or [0.0, 0.0, 0.0]
            yaw = vehicle.heading if vehicle.heading is not None else 0.0

            vehicle_status['altitude'] = altitude
            vehicle_status['voltage'] = voltage
            vehicle_status['velocity'] = sum(v**2 for v in velocity) ** 0.5
            vehicle_status['yaw'] = yaw

            ultasonic_altitude = sensor.distance * 100
        except Exception as e:
            print(f"❌ Error updating vehicle status: {e}")
        time.sleep(5)


async def send_vehicle_status():
    global vehicle_status, user_sid, x, y, ultasonic_altitude

    while True:
        if user_sid:
            await sio.emit("command_status", {
                "user_sid": user_sid,
                "status": {
                    "altitude": vehicle_status["altitude"],
                    "voltage": vehicle_status["voltage"],
                    "velocity": vehicle_status["velocity"],
                    "yaw": vehicle_status["yaw"],
                    "ultra": ultasonic_altitude,
                    "x": x,
                    "y": y
                }
            })
        await asyncio.sleep(2)


@sio.on("command")
async def handle_command(data):
    global user_sid, ultasonic_altitude
    command = data['command']
    print(f"📥 Received command: {command}")

    if command == "TakeOff":
        print("🔁 Switching to ALT_HOLD mode...")
        vehicle.mode = VehicleMode("ALT_HOLD")
        while not vehicle.mode.name == 'ALT_HOLD':
            await asyncio.sleep(1)

        print("✅ Arming...")
        vehicle.armed = True
        while not vehicle.armed:
            await asyncio.sleep(1)

        print("⬆️ Ascending...")
        target_altitude = 5.0
        while True:
            current_alt = sensor.distance * 100
            if current_alt >= target_altitude:
                break
            vehicle.channels.overrides['3'] = 1700
            await asyncio.sleep(0.5)

        vehicle.channels.overrides['3'] = 1500
        await asyncio.sleep(15)

        print("⬇️ Descending...")
        while True:
            current_alt = sensor.distance * 100
            if current_alt <= 0.5:
                break
            vehicle.channels.overrides['3'] = 1100
            await asyncio.sleep(0.5)

        vehicle.channels.overrides = {}
        vehicle.mode = VehicleMode("LAND")
        while not vehicle.mode.name == "LAND":
            await asyncio.sleep(1)

        vehicle.armed = False
        while vehicle.armed:
            await asyncio.sleep(1)

        print("🛬 Landed and disarmed.")


@sio.on("establish_connection")
async def handle_connection(data):
    global user_sid
    try:
        user_sid = data["user_sid"]
        sdp_offer = RTCSessionDescription(data["sdp_offer"]["sdp"], data["sdp_offer"]["type"])

        peer = RTCPeerConnection(RTCConfiguration(iceServers=[RTCIceServer(urls="stun:stun1.l.google.com:19302")]))
        await peer.setRemoteDescription(sdp_offer)

        video = CameraStreamTrack()
        peer.addTrack(video)

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

        print("✅ WebRTC answer sent.")
    except Exception as e:
        print(f"❌ WebRTC connection failed: {e}")
        restart_program()


async def run_app():
    global sio
    try:
        await sio.connect('http://192.168.37.201:5000', auth={"type": "uav", "id": id})
        print("✅ Connected to server")

        status_thread = threading.Thread(target=update_vehicle_status, daemon=True)
        status_thread.start()

        await asyncio.gather(
            send_vehicle_status(),
            sio.wait()
        )
    except socketio.exceptions.ConnectionError as e:
        print(f"❌ Socket.IO connection error: {e}")
        restart_program()
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        restart_program()


if __name__ == "__main__":
    try:
        asyncio.run(run_app())
    except Exception as e:
        print(f"❌ Top-level error: {e}")
        restart_program()
