import express from "express";
import cors from "cors";
import { Server as socketIO } from "socket.io";
import { chatHandler } from "./chat.js";
import { handleSignalling } from "./signalling.js";

const app = express();
app.use(cors())

app.get("/", (req, res) => {
    res.send("Hello World");
})

const server = app.listen(3500, () => {
    console.log("Server listening on port 3500");
});

const io = new socketIO(server);
const chatIO = io.of("/chat");
const signalIO = io.of("/signalling");

chatIO.on("connection", (socket)=>chatHandler(socket, chatIO));
signalIO.on("connection", handleSignalling);
