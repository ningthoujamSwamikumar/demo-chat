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

const onFormSubmitHandler = (event)=>{
    event.preventDefault();
    const msg = newMsg.value;
    if(msg){
        console.log("sending msg:", msg);
        socket.emit("chat", msg);
    }
}

msgForm.onsubmit = onFormSubmitHandler;


socket.on("chat", (msg)=>{
    const newChat = document.createElement("p");
    newChat.textContent = msg;
    chatContainer.appendChild(newChat);
    newMsg.value = "";
})
