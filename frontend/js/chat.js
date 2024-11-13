import {
    onAlias,
    onAllConnections,
    onChat,
    onCloseEditProfile,
    onEditProfile,
    onMsgSubmit,
    onPeerConnection,
    onPeerDisconnected,
    onProfileClicked
} from "./chat-handlers.js";

document.addEventListener("DOMContentLoaded", (ev) => {

    const socket = io("http://localhost:3500/chat", {
        transports: ['websocket', 'polling', 'flashsocket'],
        cors: {
            origin: "http://localhost:3000",
            credentials: true
        },
        withCredentials: true
    });

    const msgForm = document.getElementById("msg-form");
    const newMsg = document.getElementById("new-msg");
    const chatContainer = document.querySelector("#chat-container");
    const myProfile = document.getElementById("my-profile");
    const editProfileForm = document.getElementById("edit-profile-form");

    editProfileForm.onreset = onCloseEditProfile;
    editProfileForm.onsubmit = (event) => onEditProfile(event, socket);
    myProfile.addEventListener("click", onProfileClicked);
    msgForm.onsubmit = onMsgSubmit;

    socket.on("all-connections", (connections) => onAllConnections(connections, socket));   //recieved at first connect
    socket.on("peer-connection", onPeerConnection); //recieved on new peer connections
    socket.on("peer-disconnected", onPeerDisconnected); //recieved on peer disconnect
    socket.on("alias", (payload) => onAlias(payload, socket));  //recieved on peer or self alias
    socket.on("chat", onChat);

})
