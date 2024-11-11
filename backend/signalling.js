const rooms = {}; //<roomId, [<payload>]>

export const handleSignalling = (socket)=>{
    console.log("-------------- new signalling connection -------------");
    socket.on("signalling", ({roomId, payload})=>{
        if(!rooms[roomId]){
            rooms[roomId] = [];
        }
        rooms[roomId].push(payload);
        //broadcast
        socket.broadcast.emit("signalling", {roomId, payload});
    })
}