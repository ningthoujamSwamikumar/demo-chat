import { io } from "https://cdn.socket.io/4.8.0/socket.io.esm.min.js";

const socket = io("http://localhost:3500", {
    transports: ['websocket', 'polling', 'flashsocket'],
    cors: {
        origin: "http://localhost:3000",
        credentials: true
    },
    withCredentials: true
});

socket.on("connect", ()=>{
    console.log("connection established");
})

export const isConnected = ()=> socket.connected;

export const sendMessage = (msg)=>{
    socket.emit("chat", msg);
}
