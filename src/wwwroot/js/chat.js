document.addEventListener("DOMContentLoaded", () => {

const connection = new signalR.HubConnectionBuilder()
.withUrl("/chatHub")
.withAutomaticReconnect()
.build();

const joinBtn = document.getElementById("join-btn");
const usernameInput = document.getElementById("username-input");
const roomSelect = document.getElementById("room-select");

const loginSection = document.getElementById("login-section");
const chatSection = document.getElementById("chat-section");

const sendBtn = document.getElementById("send-btn");
const messageInput = document.getElementById("message-input");

const messagesList = document.getElementById("messages-list");
const roomsList = document.getElementById("rooms-list");
const usersList = document.getElementById("users-list");

const connectionStatus = document.getElementById("connection-status");
const currentRoom = document.getElementById("current-room");

let username="";
let room="";

joinBtn.addEventListener("click", async () => {

username=usernameInput.value.trim();
room=roomSelect.value;

if(username==="") return;

await connection.start();

connectionStatus.innerText="Connected";

loginSection.style.display="none";
chatSection.style.display="block";

currentRoom.innerText=room;

await connection.invoke("JoinChat",username,room);

});

connection.on("ReceiveMessage", msg => {

const div=document.createElement("div");

div.className="chat-message";

div.innerHTML="<b>"+(msg.sender || msg.Sender)+"</b>: "+(msg.content || msg.Content);

messagesList.appendChild(div);

messagesList.scrollTop=messagesList.scrollHeight;

});

connection.on("ReceiveMessageHistory", history => {

messagesList.innerHTML="";

history.forEach(msg => {

const div=document.createElement("div");

div.className="chat-message";

div.innerHTML="<b>"+(msg.sender || msg.Sender)+"</b>: "+(msg.content || msg.Content);

messagesList.appendChild(div);

});

});

connection.on("UserJoined", user => {

if(user === username) return;

const div=document.createElement("div");

div.className="system-message";

div.innerText=user+" joined the room";

messagesList.appendChild(div);

});

connection.on("ReceiveRooms", (rooms,current) => {

roomsList.innerHTML="";

rooms.forEach(r => {

const li=document.createElement("li");

li.innerText="# "+r;

if(r===current) li.style.fontWeight="bold";

roomsList.appendChild(li);

});

});

connection.on("ReceiveActiveUsers", users => {

usersList.innerHTML="";

users.forEach(u => {

const li=document.createElement("li");

li.innerText="? "+(u.username || u.Username);

usersList.appendChild(li);

});

});

sendBtn.addEventListener("click", async () => {

const msg=messageInput.value;

if(msg==="") return;

await connection.invoke("SendMessage",username,msg);

messageInput.value="";

});

});


let joinMessageShown=false;

connection.on("UserJoined",user=>{

if(joinMessageShown) return;

joinMessageShown=true;

const div=document.createElement("div");

div.className="system-message";

div.innerText=user+" joined the room";

messagesList.appendChild(div);

});



const userCount = document.getElementById("user-count");

connection.on("ReceiveActiveUsers", users => {

usersList.innerHTML="";

users.forEach(u => {

const li=document.createElement("li");

li.innerText = (u.username || u.Username);

usersList.appendChild(li);

});

if(userCount){
userCount.innerText = users.length;
}

});

