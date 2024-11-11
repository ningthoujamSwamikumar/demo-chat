const rooms = {}; //<roomId, [<msg>]> // msg: {id: "", data: ""}
const connections = {}; //<socketId, alias>

export const chatHandler = (socket) => {
    console.log("****************** new chat connection *********************");
    console.log("socket.id: ", socket.id);

    connections[socket.id] = "";
    socket.emit("new-connection", {id: socket.id, alias: ""});

    socket.on("alias", ({alias, callback})=>{
        if(!Object.values(connections).some(name=>name===alias)){
            connections[socket.id] = alias;
            socket.emit("alias", {id: socket.id, alias});
            callback();
            return;
        }
        callback("duplicate found!");
    });

    socket.on("disconnect", (reason)=>{
        delete connections[socket.id];
        console.log("disconnect", reason);
        socket.emit("disconnection", {id: socket.id});
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

