const myProfile = document.getElementById("my-profile");
const myContacts = document.getElementById("my-contacts");
const editProfileContainer = document.getElementById("edit-profile-container");
const chatHeader = document.getElementById("chat-header");
const chats = document.getElementById("chats");
const newMsg = document.getElementById("new-msg");
const usernameInput = document.getElementById("username");
const chatContainer = document.getElementById("chat-container");
const contactContainer = document.getElementById("contact-container");
const backIcon = document.getElementById("back-icon");

export const onAllConnections = (connections, socket) => {
    console.log("all-connections");
    myContacts.innerHTML = '';
    for (const [id, name] of Object.entries(connections)) {
        console.log("id:", id, "name:", name);
        if (id === socket.id) {
            if (name) myProfile.textContent = name.length > 10 ? name.slice(0, 10) + "..." : name;
            else myProfile.textContent = id.length > 10 ? id.slice(0, 10) + "..." : id;
            myProfile.setAttribute("data-socket", socket.id);
        } else {
            const newChild = document.createElement("p");
            newChild.id = id;
            if (name) newChild.textContent = name;
            else newChild.textContent = id.length > 10 ? id.slice(0, 10) + "..." : id;
            newChild.addEventListener("click", onChatSelection);
            myContacts.appendChild(newChild);
        }
    }
}

export const onPeerConnection = ({ id }) => {
    console.log("peer-connection", id);
    const newChild = document.createElement("p");
    newChild.textContent = id;
    newChild.id = id;
    newChild.addEventListener("click", onChatSelection);
    myContacts.appendChild(newChild);
}

export const onPeerDisconnected = ({ id }) => {
    console.log("disconnecting", id);
    const child = myContacts.children.namedItem(id);
    if (child) {
        child.removeEventListener("click", onChatSelection);
        myContacts.removeChild(child);
    }
    if (chatHeader.getAttribute("data-socket") === id) {
        chatHeader.innerHTML = '';
        chats.innerHTML = '';
    }
}

export const onAlias = ({ id, alias }, socket) => {
    console.log("alias", alias, "for", id, "in socket", socket.id);
    if (socket.id === id) { //checks its self
        myProfile.textContent = alias.length > 10 ? alias.slice(0, 10) + "..." : alias;
    } else {
        const myContact = myContacts.children.namedItem(id);
        console.log("myContacts", myContacts, "myContact", myContact);
        myContact.textContent = alias.length > 10 ? alias.slice(0, 10) + "..." : alias;
        if (myContact.classList.contains("current-chat")) {
            chatHeader.textContent = "Chatting with " + alias;
        }
    }
}

export const onProfileClicked = (event) => {
    editProfileContainer.style.display = "flex";
    if(usernameInput){
        console.log("calling focus on username input");
        usernameInput.focus();
    }
}

export const onCloseEditProfile = (event) => {
    editProfileContainer.style.display = "none";
}

export const onEditProfile = (event, socket) => {
    event.preventDefault();
    //submit form using socket i.e. emit alias event
    const formData = new FormData(event.target);
    const alias = formData.get("username");
    socket.emit("alias", { alias });
    editProfileContainer.style.display = "none";
}

////////////////////////////////// 
const messages = {
    //roomId: [<msg, src, dest>]
};

export const onChatSelection = (event) => {
    console.log("onChatSelection");
    const destId = event.target.id;
    const destName = event.target.textContent;

    if (window.innerWidth <= 600) {
        contactContainer.classList.add("hide");
        chatContainer.classList.remove("hide");
    }

    chatHeader.textContent = "Chatting with " + destName;
    chatHeader.setAttribute("data-socket", destId);
    //remove current-chat from old contact and put in new contact
    const oldContact = document.querySelector(".current-chat");
    if (oldContact) oldContact.classList.remove("current-chat");
    event.target.classList.add("current-chat");

    if (chats.childElementCount > 0) {
        chats.innerHTML = '';
    }

    //render messages if any
    const roomId = event.target.getAttribute("data-room");
    if (!roomId) return;
    const msgs = messages[roomId];
    for (const { msg, src, dest } of msgs) {
        const newChat = document.createElement("p");
        newChat.textContent = msg;
        newChat.classList.add("chat");
        if (src === myProfile.getAttribute("data-socket")) newChat.classList.add("right-chat");
        chats.appendChild(newChat);
    }
    //removed unread msg mark from current contact
    const unreadMark = event.target.children[0];
    if (unreadMark) event.target.removeChild(unreadMark);

    //latest messages are visible
    chats.scrollTop = chats.scrollHeight;
}

export const onMsgSubmit = (event, socket) => {
    event.preventDefault();
    if (!chatHeader.getAttribute("data-socket")) {
        const popover = document.createElement("div");
        popover.textContent = "Select a peer to chat";
        popover.setAttribute("popover", "auto");
        popover.classList.add("popover");
        document.body.appendChild(popover);
        popover.showPopover();
        return;
    }
    const msg = newMsg.value;
    if (msg) {
        console.log("sending msg:", msg);
        socket.emit("chat", { msg, dest: chatHeader.getAttribute("data-socket"), type: "peer" });
    }
}

export const onChat = ({ msg, src, dest, roomId }) => {
    console.log("onChat", msg, src, dest, roomId);
    //record chat
    if (!messages[roomId]) messages[roomId] = [];
    messages[roomId].push({ msg, src, dest });
    //handle according to src and dest
    if (src === myProfile.getAttribute("data-socket")) onChatSrc({ msg, src, dest, roomId });
    if (dest === myProfile.getAttribute("data-socket")) onChatDest({ msg, src, dest, roomId });
}

function onChatSrc({ msg, dest, roomId }) {
    console.log("onChatSrc");
    const myContact = myContacts.children.namedItem(dest);
    console.log("myContact", myContact);
    if (!myContact.getAttribute("data-room")) myContact.setAttribute("data-room", roomId);
    if (myContact.classList.contains("current-chat")) { //render if the contact is already open in chats
        const newChat = document.createElement("p");
        newChat.textContent = msg;
        newChat.classList.add("chat", "right-chat");
        chats.appendChild(newChat);
    } else {//this may not happen at all, marked the contact if not already open in chats
        if (myContact.childElementCount === 0) {
            const newSpan = document.createElement("span");
            newSpan.classList.add("unread-msg");
            myContact.appendChild(newSpan);
        }
    }
    newMsg.value = "";

    //latest messages are visible
    chats.scrollTop = chats.scrollHeight;
}

function onChatDest({ msg, src, roomId }) {
    console.log("onChatDest");
    const myContact = myContacts.children.namedItem(src);
    if (!myContact.getAttribute("data-room")) myContact.setAttribute("data-room", roomId);
    if (myContact.classList.contains("current-chat")) { //render if the contact is already open in chats
        const newChat = document.createElement("p");
        newChat.textContent = msg;
        newChat.classList.add("chat");
        chats.append(newChat);
    } else {//this can happen most of the time in dest
        if (myContact.childElementCount === 0) {
            const newSpan = document.createElement("span");
            newSpan.classList.add("unread-msg");
            myContact.appendChild(newSpan);
        }
    }
    //latest messages are visible
    chats.scrollTop = chats.scrollHeight;
}

export const onBack = (event) => {
    chatContainer.classList.add("hide");
    contactContainer.classList.remove("hide");
}

export const onScreenResize = (event) => {
    if (window.innerWidth <= 600) {
        if(chatHeader.getAttribute("data-socket")){
            backIcon.classList.remove("hide");
            contactContainer.classList.add("hide");
        }else{
            chatContainer.classList.add("hide");
            contactContainer.classList.remove("hide");
        }
    }else{
        chatContainer.classList.remove("hide");
        contactContainer.classList.remove("hide");
        backIcon.classList.add("hide");
    }
}
