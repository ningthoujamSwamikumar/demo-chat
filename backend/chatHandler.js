import { v4 as uuidv4 } from "uuid";

export const onNewConnection = (socket, connections) => {
    connections[socket.id] = "";
    socket.data.username = "";
    console.log("socket.id: ", socket.id, "connections:", connections);
    socket.emit("all-connections", connections);
    socket.broadcast.emit("peer-connection", { id: socket.id });
}

export const onAlias = ({ alias }, socket, connections, io) => {
    console.log("alias");
    if (!Object.values(connections).some(name => name === alias)) {
        connections[socket.id] = alias;
        socket.data.username = alias;
        io.emit("alias", { id: socket.id, alias });
    }
}

export const onDisconnect = (reason, socket, io, connections) => {
    delete connections[socket.id];
    console.log("disconnect", reason);
    io.emit("peer-disconnected", { id: socket.id });
}

export const onChat = ({ msg, dest, type }, socket, io, peerRooms) => {
    if (type === "peer") handlePeerChat({ msg, src: socket.id, dest }, io, peerRooms);
    if (type === "group") handleGroupChat({ msg, src: socket.id, dest }, socket);
}

export const handlePeerChat = ({ msg, src, dest }, io, peerRooms) => {
    console.log("peerChat", msg, src, dest);
    let roomId = lookupOrCreateRoom(src, dest, peerRooms, io);
    io.to(roomId).emit("chat", { msg, src, dest, roomId });
}

export const lookupOrCreateRoom = (src, dest, peerRooms, io) => {
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

    return roomId;
}

export const handleGroupChat = ({ msg, src, dest }, socket) => {

}