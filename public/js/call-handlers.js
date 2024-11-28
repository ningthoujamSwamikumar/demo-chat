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

const incomingToggleElements = [incomingAction, incomingResponseAction, incomingVideo, incomingMic, incomingMicOff, incomingVideocam, incomingVideocamOff, incomingControls];
const outgoingToggleElements = [outgoingVideo, outgoingMic, outgoingMicOff, outgoingVideocam, outgoingVideocamOff, outgoingControls];

const dataCallReciever = "data-call-reciever";
const dataCallCaller = "data-call-caller";
const dataSocket = "data-socket";

let incomingTimeOut;
/**
 * @type {MediaStream}
 */
let localStream;
/**
 * @type {RTCPeerConnection | null}
 */
let rtcPeerConnection;
/** 
 * @type {Object}
 * @property {string} src source socket id
 * @property {string} dest destination socket id
 * @property {"voice" | "video"} type call type
 * @property {string} sdp sdp either offer or answer
*/
let offerPayload;
let candidatePayload = [];
let disconnectionTimeout;
let restartTimeout;
/**
 * @type {"receiver" | "caller" | null}
 */
let userRole;
let src, dest;
let signalTimeout;

const rtcConfig = {
    iceServers: [
        {
            urls: 'stun:stun.1.google.com:19302'
        }
    ]
};

export const onPhoneClicked = (event, socket) => {
    console.log("onPhoneClicked");
    makeCalls(socket, "voice");
}

export const onVideoClicked = (event, socket) => {
    console.log("onVideoClicked");
    makeCalls(socket, "video");
}

const makeCalls = (socket, type) => {
    src = myProfile?.getAttribute(dataSocket);
    dest = chatHeader?.getAttribute(dataSocket);
    if (!src || !dest) {
        alert("invalid call");
        return;
    }
    outgoingTitle.textContent = "Voice call to " + chatHeader.getAttribute(dataSocket);
    outgoingStatus.textContent = "Initiating connection";
    outgoingCall.setAttribute(dataCallCaller, src);
    outgoingCall.setAttribute(dataCallReciever, dest);
    outgoingCall.showPopover();
    userRole = "caller";
    initiateConnection(socket, src, dest, type);
}

const initiateConnection = async (socket, src, dest, type) => {
    console.log("initiateConnection");
    localStream = await navigator.mediaDevices.getUserMedia(type === "video" ?
        { audio: true, video: { width: window.innerWidth * 0.5, height: window.innerHeight * 0.5 } }
        : { audio: true });
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
    rtcPeerConnection.onnegotiationneeded = (event) => restartConnection();
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
    signalTimeout = setTimeout(() => {
        outgoingStatus.textContent = "Network Error";
        setTimeout(() => {
            rtcPeerConnection.close();
            releaseResources();
        }, 500);
    }, 2000);
    if (sdp.type === "offer") {
        socket.emit("sdp", { src, dest, sdp, type },
            (response) => {
                console.log("sending offer acknowledgement", response);
                if (signalTimeout) {
                    clearTimeout(signalTimeout);
                }
                if (response.status === "busy") {
                    outgoingStatus.textContent = response.status;
                    setTimeout(() => {
                        rtcPeerConnection.close();
                        releaseResources();
                    }, 500);
                }
            }
        );
    } else {
        socket.emit("sdp", { src, dest, sdp, type },
            (response) => {
                console.log("sending answer acknowledgement", response);
                if (signalTimeout) {
                    clearTimeout(signalTimeout);
                }
                incomingStatus.textContent = "initiating connection";
            }
        )
    }
}

export const onSdp = (payload, socket) => {
    console.log("onSdp");
    const { sdp } = payload;
    if (sdp.type === "offer") {
        src = payload.src;
        dest = payload.dest;
        userRole = "receiver";
        recieveOffer(payload, socket);
        return;
    }
    if (sdp.type === "answer") {
        recieveAnswer(payload);
    }
}

const recieveAnswer = (payload) => {
    const { src, dest, sdp, type } = payload;
    if (!rtcPeerConnection) {
        console.log("undefined rtcPeerConnection in handleAnswer");
        return;
    }
    console.log("call connected");
    rtcPeerConnection.setRemoteDescription(sdp);
    outgoingStatus.textContent = "Connected";
    outgoingControls.classList.remove("hide");
    outgoingVideo.classList.remove("hide");
    outgoingMicOff.classList.remove("hide");
    if (type === "video") {
        outgoingVideocamOff.classList.remove("hide");
    } else {
        outgoingVideocam.classList.remove("hide");
    }
}

const recieveOffer = (payload, socket) => {
    const { src, dest, type } = payload;
    incomingTitle.textContent = type === "voice" ? `Incoming Voice Call from ${src}` : `Incoming Video Call from ${src}`;
    incomingStatus.textContent = "Answer or Reject";
    [incomingResponseAction,
        // incomingAnswer, incomingReject

    ].forEach(ele => ele.classList.remove("hide"));
    incomingCall.showPopover();
    offerPayload = payload;
    incomingTimeOut = setTimeout(() => {
        if (!rtcPeerConnection) {
            //still unanwered then consider rejection
            onRejectIncoming(null, socket);
        }
    }, 30000); //ringing for 20 seconds
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
    clearTimeout(incomingTimeOut);
    answerConnection(socket, offerPayload);
    incomingResponseAction.classList.add("hide");
    [incomingVideo, incomingAction, incomingControls, incomingMic, offerPayload.type === "video" ? incomingVideocamOff : incomingVideocam].forEach(ele => ele.classList.remove("hide"));
    offerPayload = null;
}

const answerConnection = async (socket, payload) => {
    const { src, dest, sdp, type } = payload;
    console.log("answer connection");
    localStream = await navigator.mediaDevices.getUserMedia(type === "video" ?
        { audio: true, video: { width: window.innerWidth * 0.5, height: window.innerHeight * 0.5 } }
        : { audio: true });
    rtcPeerConnection = new RTCPeerConnection(rtcConfig);
    localStream.getTracks().forEach(track => rtcPeerConnection.addTrack(track, localStream));
    rtcPeerConnection.ontrack = (event) => incomingVideo.srcObject = event.streams[0];
    rtcPeerConnection.onconnectionstatechange = (event) => onConnectionStateChange(src, dest, socket);
    rtcPeerConnection.onicecandidate = (event) => signalIceCandidate(socket, src, dest, event.candidate);
    rtcPeerConnection.setRemoteDescription(sdp);

    let answer;
    answer = await rtcPeerConnection.createAnswer({ iceRestart: true, offerToReceiveAudio: true, offerToReceiveVideo: type === "voice" ? false : true });
    rtcPeerConnection.setLocalDescription(answer);
    candidatePayload.forEach(({ candidate }) => rtcPeerConnection.addIceCandidate(candidate));
    candidatePayload = [];
    signalSdp(socket, src, dest, answer, type);
}

/**
 * @listens connectionstatechange 
 * @param {string} src 
 * @param {string} dest 
 * @param {Socket} socket a socket client
 */
const onConnectionStateChange = (src, dest, socket) => {
    console.log("on connection state change", rtcPeerConnection.connectionState);
    switch (rtcPeerConnection.connectionState) {
        case "closed": //this is not triggered when closing explicitly
            break;
        case "connected": //updates states on ui
            if (userRole === "receiver") {
                incomingStatus.textContent = "connected";
            } else {
                outgoingStatus.textContent = "connected";
                if (disconnectionTimeout) {
                    clearTimeout(disconnectionTimeout);
                }
                if (restartTimeout) {
                    clearTimeout(restartTimeout);
                }
            }
            break;
        case "connecting": //update states on ui, caller: clear any active setTimeout from prev disconnected
            if (userRole === "receiver") {
                incomingStatus.textContent = "connecting";
            } else {
                outgoingStatus.textContent = "connecting";
                if (disconnectionTimeout) {
                    clearTimeout(disconnectionTimeout);
                }
                if (restartTimeout) {
                    clearTimeout(restartTimeout);
                }
            }
            break;
        case "disconnected": //setTimeout if not already and trigger restart
            if (userRole === "receiver") {
                incomingStatus.textContent = "reconnecting";
            } else {
                outgoingStatus.textContent = "reconnecting";
                if (!disconnectionTimeout) {
                    disconnectionTimeout = setTimeout(() => restartConnection(), 3000);
                }
            }
            break;
        case "failed": //clear any active settimeout from other states, trigger restart connection
            if (userRole === "receiver") {
                incomingStatus.textContent = "reconnecting";
            } else {
                outgoingStatus.textContent = "reconnecting";
                if (disconnectionTimeout) {
                    clearTimeout(disconnectionTimeout);
                }
                restartConnection();
                restartTimeout = setTimeout(() => {
                    socket.emit("call-disconnect", { src, dest });
                    rtcPeerConnection.close();
                    outgoingStatus.textContent = "restart failed";
                    rtcPeerConnection.close();
                    releaseResources();
                }, 5000);
            }
            break;
        default: console.log("new connection");
    }
}

//to implement
const restartConnection = () => {
    console.log("restarting connection");
}

const releaseResources = () => {
    console.log("releasing resources");
    endAllTrack();
    if (userRole === "caller") {
        if (outgoingVideo.srcObject) {
            outgoingVideo.srcObject = null;
        }
        outgoingToggleElements.forEach(ele => ele.classList.add("hide"));
        outgoingCall.hidePopover();
    } else {
        if (incomingVideo.srcObject) {
            incomingVideo.srcObject = null;
        }
        incomingToggleElements.forEach(ele => ele.classList.add("hide"));
        incomingCall.hidePopover();
        offerPayload = null;
        candidatePayload = [];
    }
    rtcPeerConnection = null;
    userRole = null;
    src = undefined;
    dest = undefined;
    localStream = undefined;
}

export const onOutgoingCallDisconnect = (event, socket) => {
    console.log("onOutgoingCallDisconnect", src, dest);
    socket.emit("call-disconnect", { src, dest });
    rtcPeerConnection.close();
    releaseResources();
}

export const onIncomingCallDisconnect = (event, socket) => {
    console.log("onIncomingCallDisconnect", src, dest);
    socket.emit("call-disconnect", { src, dest });
    rtcPeerConnection.close();
    releaseResources();
}

export const onRejectIncoming = (event, socket) => {
    console.log("onRejectIncoming");
    socket.emit("call-disconnect", { src, dest });
    releaseResources();
    incomingCall.hidePopover();
}

export const onCallDisconnection = (payload) => {
    console.log("onCallDisconnection");
    if(rtcPeerConnection){
        rtcPeerConnection.close();
    }
    releaseResources();
}

const endAllTrack = () => {
    if(!localStream) return;
    localStream.getTracks().forEach(track => track.stop());
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
