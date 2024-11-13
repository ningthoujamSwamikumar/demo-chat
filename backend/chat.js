const rooms = {}; //<roomId, [<msg>]> // msg: {id: "", data: ""}
const connections = {}; //<socketId, alias>

export const chatHandler = (socket, io) => {
    console.log("****************** new chat connection *********************");
    console.log("socket.id: ", socket.id);

    connections[socket.id] = "";
    socket.data.username = "";
    socket.emit("all-connections", connections);
    socket.broadcast.emit("peer-connection", {id:socket.id});

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

    socket.on("chat", ({ roomId, message, sender }) => {
        if (!rooms[roomId]) {
            rooms[roomId] = [];
        }
        rooms[roomId].push({ roomId, message, sender });
        //broadcast to all except itself
        socket.to(roomId).broadcast.emit("chat", { roomId, message, sender });
    });
}

