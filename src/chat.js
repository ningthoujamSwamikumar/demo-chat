import { onSdp, onCandidate, onCallDisconnection } from "./callHandler.js";
import { onNewConnection, onAlias, onDisconnect, onChat } from "./chatHandler.js"
/**
* Represents a mapping from source ID to a nested object containing destination IDs and room IDs. 
* @type {Object.<string, Object.<string, string>>} 
* @property {Object.<string, string>} srcId - An object where each key is a source ID. 
* @property {string} srcId.destId - The ID of the destination (e.g., "destination123"). 
* @property {string} srcId.destId.roomId - The ID of the room associated with the destination (e.g., "room456"). 
* @example 
* { 
*   "srcId1": { 
*       "destId1": "roomId1", 
*       "destId2": "roomId2" 
*    }, 
*    "srcId2": { 
*       "destId3": "roomId3" 
*    } 
* } 
*/
const peerRooms = {}; //srcId: {destId: roomId}
const groupRooms = {}; //roomId : [socketIds]
const connections = {}; //<socketId, alias>
const peersOnCalls = {}; //<socketId, roomId>

export const chatHandler = (socket, io) => {
    console.log("****************** new chat connection *********************");

    onNewConnection(socket, io, connections);

    socket.on("alias", (payload) => onAlias(payload, socket, connections, io));

    socket.on("disconnect", (reason) => onDisconnect(reason, socket, io, connections));

    socket.on("chat", (payload) => onChat(payload, socket, io, peerRooms));

    socket.on("sdp", (payload, callback) => onSdp(payload, callback, peerRooms, peersOnCalls, socket, io));

    //socket.on("call-reject", (payload) => onCallRejection(payload, peerRooms, peersOnCalls, socket, io));

    socket.on("call-disconnect", (payload) => onCallDisconnection(payload, peerRooms, peersOnCalls, socket, io));

    socket.on("candidate", (payload) => onCandidate(payload, peerRooms, peersOnCalls, socket, io));
}

