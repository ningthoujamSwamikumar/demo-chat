import { onSdp, onCandidate } from "./callHandler.js";
import { onNewConnection, onAlias, onDisconnect, onChat } from "./chatHandler.js"

const peerRooms = {}; //srcId: {destId: roomId}
const groupRooms = {}; //roomId : [socketIds]
const connections = {}; //<socketId, alias>
const peersOnCalls = {}; //<socketId, roomId>

export const chatHandler = (socket, io) => {
    console.log("****************** new chat connection *********************");

    onNewConnection(socket, connections);

    socket.on("alias", (payload) => onAlias(payload, socket, connections, io));

    socket.on("disconnect", (reason) => onDisconnect(reason, socket, io, connections));

    socket.on("chat", (payload) => onChat(payload, socket, io, peerRooms));

    socket.on("sdp", (payload, callback) => onSdp(payload, callback, peerRooms, peersOnCalls, socket, io));

    socket.on("candidate", (payload)=>onCandidate(payload, peerRooms, peersOnCalls, socket, io));
}

