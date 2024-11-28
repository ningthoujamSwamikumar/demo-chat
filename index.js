import express from "express";
import path from 'path';
import { Server } from "socket.io";
import { chatHandler } from "./src/chat.js";

const __dirname = path.resolve();
const port = 3500;

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

const server = app.listen(port, '0.0.0.0', () => {
    console.log("Server listening on port 0.0.0.0:3500");
});

const io = new Server(server);

io.on("connection", (socket) => chatHandler(socket, io));

io.engine.on("connection_error", (err) => {
    console.log("io connection_error", err);
})

/*
TODO:
1. mute, unmute
2. video, video off
3. restart connection
*/


