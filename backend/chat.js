import { v4 as uuidv4 } from "uuid";

const peerRooms = {}; //srcId: {destId: roomId}
const groupRooms = {}; //roomId : [socketIds]
const connections = {}; //<socketId, alias>

export const chatHandler = (socket, io) => {
    console.log("****************** new chat connection *********************");

    connections[socket.id] = "";
    socket.data.username = "";
    console.log("socket.id: ", socket.id, "connections:", connections);
    socket.emit("all-connections", connections);
    socket.broadcast.emit("peer-connection", { id: socket.id });

    socket.on("alias", ({ alias }) => {
        console.log("alias");
        if (!Object.values(connections).some(name => name === alias)) {
            connections[socket.id] = alias;
            socket.data.username = alias;
            io.emit("alias", { id: socket.id, alias });
        }
    });

    socket.on("disconnect", (reason) => {
        delete connections[socket.id];
        console.log("disconnect", reason);
        io.emit("peer-disconnected", { id: socket.id });
    });

    socket.on("chat", ({ msg, dest, type }) => {
        if (type === "peer") handlePeerChat({ msg, src: socket.id, dest }, io);
        if (type === "group") handleGroupChat({ msg, src: socket.id, dest }, socket);
    });
}

const handlePeerChat = ({ msg, src, dest }, io) => {
    console.log("peerChat", msg, src, dest);
    let roomId = peerRooms[src] ? peerRooms[src][dest] : "";
    if (!roomId) {
        roomId = uuidv4();
        io.in(src).socketsJoin(roomId);
        io.in(dest).socketsJoin(roomId);
        //mappings on first peer
        if (!peerRooms[src]) {
            peerRooms[src] = { [dest]: roomId };
        } else if (!peerRooms[src][dest]) {
            peerRooms[src][dest] = roomId;
        }
        //mappings on second peer
        if (!peerRooms[dest]) {
            peerRooms[dest] = { [src]: roomId };
        } else if (!peerRooms[dest][src]) {
            peerRooms[dest][src] = roomId;
        }
    }
    io.to(roomId).emit("chat", { msg, src, dest, roomId });
}

const handleGroupChat = ({ msg, src, dest }, socket) => {

}

