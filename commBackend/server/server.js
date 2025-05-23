const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const colors = require('colors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5000;
let connectedSockets = [];

io.on('connection', (socket) => {
    const { type, id } = socket.handshake.auth
    connectedSockets.push(
        {
            type,
            id,
            sid: socket.id
        }
    )
    console.log(`${type} Connected: ${socket.id}`.bgGreen.black)
    console.log(`Total Connection: ${connectedSockets.length}`.bgGreen.black);

    socket.on('disconnect', () => {
        connectedSockets = connectedSockets.filter((s) => s.sid !== socket.id)
        console.log(`${type} Connected: ${socket.id}`.bgRed.black)
        console.log(`Total Connection: ${connectedSockets.length}`.bgRed.black);
    
    });

    socket.on("establish_connection", (data) => {
        console.log("Establishing Connection".bgGreen.black)

        const { uav_id, sdp_offer } = data
        const uav_sid = connectedSockets.find((s) => s.id === uav_id)?.sid;

        if (!uav_sid) {
            console.log(`UAV with ID ${uav_id} not found`.bgRed.black);
        }

        io.to(uav_sid).emit("establish_connection", { user_sid: socket.id, sdp_offer })
        console.log("Requested for answer".bgGreen.black)
    })

    socket.on("ice_candidates", (data) => {
        let { target_sid, ice_candidates } = data
        console.log(`Exchangeing ICE Candidate ${ice_candidates.length}`.bgGreen.black)
        io.to(target_sid).emit("ice_candidates", { ice_candidates })
    })

    socket.on("command", (data) => {
        let { uav_sid, command } = data
        console.log(`Command EXCHANGE ${uav_sid}, ${command}`.bgGreen.black)
        io.to(uav_sid).emit("command", { command })
    })

    socket.on("command_status", (data) => {
        let { user_sid, status } = data
        console.log(`Command EXCHANGE ${user_sid}, ${status}`.bgGreen.black)
        io.to(user_sid).emit("command_status", { status })
    })

    socket.on("complete_connection", (data) => {
        console.log("Completing Connection".bgGreen.black)
        const { uav_sid, sdp_answer, user_sid } = data
        io.to(user_sid).emit("complete_connection", { sdp_answer, uav_sid })
    })

});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});