import express from "express";
import cors from "cors";
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
3. incoming call rejection doesn't end the outgoing call
4. outgoing disconnect doesn't stop audio track (icon still visible)
5. calling same peer for second time doesn't have respond actions
6. outgoing disconnect doesn't hide or end incoming
7. second call can't be after one successful call because peers are in call (busy)
8. mic doesn't off when peers are found to be busy and calls end itself.
*/


