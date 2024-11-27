const chatHeader = document.getElementById("chat-header");
const myProfile = document.getElementById("my-profile");
const incomingCall = document.getElementById("incoming-call");
const outgoingCall = document.getElementById("outgoing-call");
const outgoingTitle = document.getElementById("outgoing-title");
const incomingTitle = document.getElementById("incoming-title");
const outgoingStatus = document.getElementById("outgoing-status");
const incomingStatus = document.getElementById("incoming-status");
const outgoingControls = document.getElementById("outgoing-controls");
const incomingControls = document.getElementById("incoming-controls");
const outgoingVideo = document.getElementById("outgoing-video");
const incomingVideo = document.getElementById("incoming-video");
const incomingReject = document.getElementById("incoming-reject");
const incomingAnswer = document.getElementById("incoming-answer");
const incomingAction = document.getElementById("incoming-action");
const incomingResponseAction = document.getElementById("incoming-response-action");
const incomingMic = document.getElementById("incoming-control-mic");
const incomingMicOff = document.getElementById("incoming-control-mic_off");
const incomingVideocam = document.getElementById("incoming-control-videocam")
const incomingVideocamOff = document.getElementById("incoming-control-videocam_off");
const outgoingMic = document.getElementById("outgoing-control-mic");
const outgoingMicOff = document.getElementById("outgoing-control-mic_off");
const outgoingVideocam = document.getElementById("outgoing-control-videocam")
const outgoingVideocamOff = document.getElementById("outgoing-control-videocam_off");

let rtcPeerConnection;
let offerPayload;
let candidatePayload = [];

const rtcConfig = {
    iceServers: [
        {
            urls: 'stun:stun.1.google.com:19302'
        }
    ]
};

export const onPhoneClicked = (event, socket) => {
    console.log("onPhoneClicked");
    handleCalls(socket, "voice");
}

export const onVideoClicked = (event, socket) => {
    console.log("onVideoClicked");
    handleCalls(socket, "video");
}

const handleCalls = (socket, type) => {
    if (!chatHeader) {
        console.log("chatHeader is undefined");
        return;
    }
    if (!myProfile) {
        console.log("myProfile is undefined");
        return;
    }
    //
    outgoingTitle.textContent = "Voice call to " + chatHeader.getAttribute("data-socket");
    outgoingStatus.textContent = "Initiating connection";
    outgoingCall.showPopover();
    initiateConnection(socket, myProfile.getAttribute("data-socket"), chatHeader.getAttribute("data-socket"), type);
}

const initiateConnection = async (socket, src, dest, type) => {
    console.log("initiateConnection");
    let localStream;
    if (type === "video") {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: { width: window.innerWidth * 0.5, height: window.innerHeight * 0.5 } });
    }
    if (type === "voice") {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }
    rtcPeerConnection = new RTCPeerConnection(rtcConfig);

    localStream.getTracks().forEach(track => rtcPeerConnection.addTrack(track, localStream));
    rtcPeerConnection.ontrack = (event) => outgoingVideo.srcObject = event.streams[0];

    let offer;
    if (type === "video") {
        offer = await rtcPeerConnection.createOffer({ iceRestart: true, offerToReceiveAudio: true, offerToReceiveVideo: true });
    }
    if (type === "voice") {
        offer = await rtcPeerConnection.createOffer({ iceRestart: true, offerToReceiveAudio: true, offerToReceiveVideo: false });
    }
    rtcPeerConnection.onicecandidate = (event) => signalIceCandidate(socket, src, dest, event.candidate);
    rtcPeerConnection.onconnectionstatechange = (event) => onConnectionStateChange(src, dest, socket);
    rtcPeerConnection.setLocalDescription(offer); //triggers onicecandidate event
    signalSdp(socket, src, dest, offer, type);
}

const signalIceCandidate = (socket, src, dest, candidate) => {
    if (candidate) {
        console.log("sending candidate");
        socket.emit("candidate", { src, dest, candidate });
    }
}

const signalSdp = (socket, src, dest, sdp, type) => {
    console.log("sending sdp");
    if (sdp.type === "offer") {
        socket.emit("sdp", { src, dest, sdp, type },
            (response) => {
                console.log("sending offer acknowledgement", response);
                outgoingStatus.textContent = response.status;
                if (response.status === "busy") {
                    setTimeout(() => outgoingCall.hidePopover(), 1000);
                    rtcPeerConnection.close();
                }
            }
        );
    } else {
        socket.emit("sdp", { src, dest, sdp, type },
            (response) => {
                console.log("sending answer acknowledgement", response);
                incomingStatus.textContent = "connecting";
            }
        )
    }
}

export const onSdp = (payload, socket) => {
    console.log("onSdp");
    const { sdp } = payload;
    if (sdp.type === "offer") {
        handleOffer(payload);
        return;
    }
    if (sdp.type === "answer") {
        handleAnswer(payload);
    }
}

const handleAnswer = (payload) => {
    const { src, dest, sdp, type } = payload;
    if (!rtcPeerConnection) {
        console.log("undefined rtcPeerConnection in handleAnswer");
        return;
    }
    rtcPeerConnection.setRemoteDescription(sdp);
    outgoingStatus.textContent = "Connected";
    outgoingControls.classList.remove("hide");
    outgoingVideo.classList.remove("hide");
    outgoingMicOff.classList.remove("hide");
    console.log("outgoing call type", type);
    if (type === "video") {
        outgoingVideocamOff.classList.remove("hide");
    } else {
        outgoingVideocam.classList.remove("hide");
    }
}

const handleOffer = (payload) => {
    const { src, dest, type } = payload;
    incomingTitle.textContent = type === "voice" ? `Incoming Voice Call from ${src}` : `Incoming Video Call from ${src}`;
    incomingStatus.textContent = "Unresponded";
    incomingCall.showPopover();
    offerPayload = payload;
}

export const onCandidate = (payload, socket) => {
    console.log("onCandidate");
    const { src, dest, candidate } = payload;
    if (!rtcPeerConnection) {
        candidatePayload.push(payload);
        return;
    }
    rtcPeerConnection.addIceCandidate(candidate);
}

export const onIncomingAnswer = (event, socket) => {
    console.log("onIncomingAnswer");
    answerConnection(socket, offerPayload);
    incomingVideo.classList.remove("hide");
    incomingAction.classList.remove("hide");
    incomingResponseAction.classList.add("hide");
    incomingControls.classList.remove("hide");
    incomingMicOff.classList.remove("hide");
    if (offerPayload.type === "video") {
        incomingVideocamOff.classList.remove("hide");
    } else {
        incomingVideocam.classList.remove("hide");
    }
    offerPayload = null;
}

const answerConnection = async (socket, payload) => {
    const { src, dest, sdp, type } = payload;
    console.log("answer connection");
    let localStream;
    if (type === "video") {
        localStream = await navigator.mediaDevices.getUserMedia(
            { audio: true, video: { width: window.innerWidth * 0.5, height: window.innerHeight * 0.5 } });
    }
    if (type === "voice") {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }
    rtcPeerConnection = new RTCPeerConnection(rtcConfig);
    localStream.getTracks().forEach(track => rtcPeerConnection.addTrack(track, localStream));
    rtcPeerConnection.ontrack = (event) => incomingVideo.srcObject = event.streams[0];
    rtcPeerConnection.onconnectionstatechange = (event) => onConnectionStateChange(src, dest, socket);
    rtcPeerConnection.onicecandidate = (event) => signalIceCandidate(socket, src, dest, event.candidate);
    rtcPeerConnection.setRemoteDescription(sdp);

    let answer;
    if (type === "voice") {
        answer = await rtcPeerConnection.createAnswer({ iceRestart: true, offerToReceiveAudio: true, offerToReceiveVideo: false });
    }
    if (type === "video") {
        answer = await rtcPeerConnection.createAnswer({ iceRestart: true, offerToReceiveAudio: true, offerToReceiveVideo: true });
    }
    rtcPeerConnection.setLocalDescription(answer);
    candidatePayload.forEach(({ candidate }) => rtcPeerConnection.addIceCandidate(candidate));
    candidatePayload = [];
    signalSdp(socket, src, dest, answer, type);
}

const onConnectionStateChange = (src, dest, socket) => {
    console.log("on connection state change", rtcPeerConnection.connectionState);
    if (["disconnected", "failed"].includes(rtcPeerConnection.connectionState)) {
        stopAudioTrack();
        stopVideoTrack();
        rtcPeerConnection.close();
        if (myProfile.getAttribute("data-socket") === src) {
            //caller
            outgoingVideo.srcObject = null;
            outgoingCall.hidePopover();

        } else {
            //reciever
            incomingVideo.srcObject = null;
            incomingCall.hidePopover();
        }
        socket.emit("call-disconnected", { src, dest });
    }
}

export const onOutgoingDisconnect = (event, socket) => {
    console.log("onOutgoingDisconnect");
    if (rtcPeerConnection) {
        rtcPeerConnection.close();
        rtcPeerConnection = null;
    }
    if (outgoingVideo.srcObject) {
        outgoingVideo.srcObject = null;
    }
    outgoingVideo.classList.add("hide");
    outgoingMic.classList.add("hide");
    outgoingMicOff.classList.add("hide");
    outgoingVideocam.classList.add("hide");
    outgoingVideocamOff.classList.add("hide");
    outgoingControls.classList.add("hide");
    outgoingCall.hidePopover();
}

export const onIncomingDisconnect = (event, socket) => {
    console.log("onIncomingDisconnect");
    rtcPeerConnection.close();
    rtcPeerConnection = null;
    incomingVideo.srcObject = null;
    incomingAction.classList.add("hide");
    incomingResponseAction.classList.add("hide");
    incomingVideo.classList.add("hide");
    incomingMic.classList.add("hide");
    incomingMicOff.classList.add("hide");
    incomingVideocam.classList.add("hide");
    incomingVideocamOff.classList.add("hide");
    incomingControls.classList.add("hide");
    incomingCall.hidePopover();
}

export const onIncomingReject = (event, socket) => {
    console.log("onIncomingReject");
    socket.emit("call-reject", { src: offerPayload.src, dest: offerPayload.dest });
    offerPayload = null;
    candidatePayload = [];
    incomingVideo.srcObject = null;
    incomingAction.classList.add("hide");
    incomingResponseAction.classList.add("hide");
    incomingVideo.classList.add("hide");
    incomingMic.classList.add("hide");
    incomingMicOff.classList.add("hide");
    incomingVideocam.classList.add("hide");
    incomingVideocamOff.classList.add("hide");
    incomingControls.classList.add("hide");
    incomingCall.hidePopover();
}

export const onCallReject = (payload) => {
    //recieves only when offer is rejected
    rtcPeerConnection.close();
    outgoingVideo.srcObject = null;
    outgoingVideo.classList.add("hide");
    outgoingMic.classList.add("hide");
    outgoingMicOff.classList.add("hide");
    outgoingVideocam.classList.add("hide");
    outgoingVideocamOff.classList.add("hide");
    outgoingControls.classList.add("hide");
    outgoingCall.hidePopover();
}

const stopAudioTrack = () => {
    if (!rtcPeerConnection) return;
    const senders = rtcPeerConnection.getSenders();
    senders.forEach(sender => {
        if (sender.track.kind === "audio") {
            sender.track.stop();
        }
    })
}

const stopVideoTrack = () => {
    if (!rtcPeerConnection) return;
    const senders = rtcPeerConnection.getSenders();
    senders.forEach(sender => {
        if (sender.track.kind === "video") {
            sender.track.stop();
        }
    })
}

const toggleControl = (event) => {
    const idParts = event.target.id.split("_");
    if (idParts.length === 1) {
        document.getElementById(idParts[0] + "_off").classList.remove("hide");
        document.getElementById(idParts[0]).classList.add("hide");
    } else {
        document.getElementById(idParts[0]).classList.remove("hide");
        document.getElementById(event.target.id).classList.add("hide");
    }
}

incomingMic.onclick = toggleControl;
incomingMicOff.onclick = toggleControl;
incomingVideocam.onclick = toggleControl;
incomingVideocamOff.onclick = toggleControl;

outgoingMic.onclick = toggleControl;
outgoingMicOff.onclick = toggleControl;
outgoingVideocam.onclick = toggleControl;
outgoingVideocamOff.onclick = toggleControl;
