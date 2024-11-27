import { lookupOrCreateRoom } from "./chatHandler.js";

export const onSdp = (payload, callback, peerRooms, peersOnCalls, socket, io) => {
    console.log("on sdp");
    const { src, dest, sdp } = payload;
    let roomId = lookupOrCreateRoom(src, dest, peerRooms, io);
    if (sdp.type === "offer") return handleOffer(payload, callback, roomId, peersOnCalls, socket);
    if (sdp.type === "answer") return handleAnswer(payload, callback, roomId, socket);
}

const handleAnswer = (payload, callback, roomId, socket) => {
    socket.to(roomId).emit("sdp", payload);
    callback({ status: "connecting" });
}

const handleOffer = (payload, callback, roomId, peersOnCalls, socket) => {
    const { src, dest } = payload;
    if (peersOnCalls[src] || peersOnCalls[dest]) {
        callback({ status: "busy" });
        return;
    }
    peersOnCalls[src] = roomId;
    peersOnCalls[dest] = roomId;
    socket.to(roomId).emit("sdp", payload);
    callback({ status: "connecting" });
}

export const onCandidate = (payload, peerRooms, peersOnCalls, socket, io) => {
    console.log("on candidate");
    const { src, dest, candidate } = payload;
    let roomId = lookupOrCreateRoom(src, dest, peerRooms, io);
    if (peersOnCalls[src] !== peersOnCalls[dest]) {
        console.log("peers on different room, during candidate");
        return;
    }
    socket.to(roomId).emit("candidate", payload);
}

export const onCallRejection = (payload, peerRooms, peersOnCalls, socket, io) => {
    console.log("on offer rejection");
    const { src, dest } = payload;
    let roomId = lookupOrCreateRoom(src, dest, peerRooms, io);
    socket.to(roomId).emit("call-disconnect", payload);
    delete peersOnCalls[src];
    delete peersOnCalls[dest];
}

export const onCallDisconnection = (payload, peersOnCalls) => {
    console.log("on call disconnection");
    const { src, dest } = payload;
    if (peersOnCalls[src]) delete peersOnCalls[src];
    if (peersOnCalls[dest]) delete peersOnCalls[dest];
}
