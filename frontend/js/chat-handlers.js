const myProfile = document.getElementById("my-profile");
const myContacts = document.getElementById("my-contacts");
const editProfileContainer = document.getElementById("edit-profile-container");

export const onChat = (msg) => {
    const newChat = document.createElement("p");
    newChat.textContent = msg;
    chatContainer.appendChild(newChat);
    newMsg.value = "";
}

export const onAllConnections = (connections, socket) => {
    console.log("all-connections");
    for (const [id, name] of Object.entries(connections)) {
        console.log("id:", id, "name:", name);
        if (id === socket.id) {
            if (name) myProfile.textContent = name;
            else myProfile.textContent = id;
        } else {
            const newChild = document.createElement("p");
            newChild.id = id;
            if (name) newChild.textContent = name;
            else newChild.textContent = id;
            myContacts.appendChild(newChild);
        }
    }
}

export const onPeerConnection = ({ id }) => {
    console.log("peer-connection", id);
    const newChild = document.createElement("p");
    newChild.textContent = id;
    myContacts.appendChild(newChild);
}

export const onPeerDisconnected = ({ id }) => {
    console.log("disconnecting", id);
    const child = myContacts.children.item(id);
    myContacts.removeChild(child);
}

export const onAlias = ({ id, alias }, socket) => {
    console.log("alias", alias, "for", id,);
    if (socket.id === id) {
        myProfile.textContent = alias;
    } else {
        const myContact = myContacts.children.item(id);
        myContact.textContent = alias;
    }
}

export const onProfileClicked = (event) => {
    editProfileContainer.style.display = "flex";
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

export const onMsgSubmit = (event) => {
    event.preventDefault();
    const msg = newMsg.value;
    if (msg) {
        console.log("sending msg:", msg);
        socket.emit("chat", msg);
    }
}
