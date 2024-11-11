import { onCameraOpen } from "./camera.js";
import { sendMessage } from "./signalling.js";

const cameraBtn = document.getElementById("camera-btn");
const messageInput = document.getElementById("message");
const messageBtn = document.getElementById("message-btn");

cameraBtn.addEventListener("click", onCameraOpen);
messageBtn.addEventListener("click", (e)=>{
    const msg = messageInput.getAttribute("value");
    if(msg){
        sendMessage({msg});
    }
})