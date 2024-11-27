import {
    onVideoClicked,
    onPhoneClicked,
    onSdp,
    onCandidate,
    onIncomingAnswer,
    onIncomingReject,
    onOutgoingDisconnect,
    onIncomingDisconnect,
    onCallReject
} from "./call-handlers.js";
import {
    onAlias,
    onAllConnections,
    onBack,
    onChat,
    onCloseEditProfile,
    onEditProfile,
    onMsgSubmit,
    onPeerConnection,
    onPeerDisconnected,
    onProfileClicked,
    onScreenResize
} from "./chat-handlers.js";

onScreenResize();

document.addEventListener("DOMContentLoaded", (ev) => {

    const socket = io("http://localhost:3500/chat", {
        transports: ['websocket', 'polling', 'flashsocket'],
        cors: {
            origin: "http://localhost:3000",
            credentials: true
        },
        withCredentials: true
    });

    socket.on("connect_error", (err) => {
        console.log("connect_error", err);
    })

    const msgForm = document.getElementById("msg-form");
    const myProfile = document.getElementById("my-profile");
    const editProfileForm = document.getElementById("edit-profile-form");
    const backIcon = document.getElementById("back-icon");
    const voiceCall = document.getElementById("voice-call");
    const videoCall = document.getElementById("video-call");
    const incomingReject = document.getElementById("incoming-reject");
    const incomingAnswer = document.getElementById("incoming-answer");
    const outgoingDisconnect = document.getElementById("outgoing-disconnect");
    const incomingDisconnect = document.getElementById("incoming-disconnect");

    editProfileForm.onreset = onCloseEditProfile;
    editProfileForm.onsubmit = (event) => onEditProfile(event, socket);
    myProfile.addEventListener("click", onProfileClicked);
    msgForm.onsubmit = (event) => onMsgSubmit(event, socket);
    backIcon.onclick = onBack;
    window.onresize = onScreenResize;
    voiceCall.onclick = (event) => onPhoneClicked(event, socket);
    videoCall.onclick = (event) => onVideoClicked(event, socket);
    outgoingDisconnect.onclick = (event) => onOutgoingDisconnect(event, socket);
    incomingAnswer.onclick = (event) => onIncomingAnswer(event, socket);
    incomingReject.onclick = (event) => onIncomingReject(event, socket);
    incomingDisconnect.onclick = (event) => onIncomingDisconnect(event, socket);

    socket.on("all-connections", (connections) => onAllConnections(connections, socket));   //recieved at first connect
    socket.on("peer-connection", onPeerConnection); //recieved on new peer connections
    socket.on("peer-disconnected", onPeerDisconnected); //recieved on peer disconnect
    socket.on("alias", (payload) => onAlias(payload, socket));  //recieved on peer or self alias
    socket.on("chat", onChat);
    socket.on("sdp", (payload) => onSdp(payload, socket));
    socket.on("candidate", (payload) => onCandidate(payload, socket));
    socket.on("call-reject", onCallReject)
})
