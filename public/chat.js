// JavaScript source code
const socket = io()

let message = document.getElementById('message');
let username = document.getElementById('username');
let output = document.getElementById('output');

function enterkey(e) {
    if (e.which == 13 || e.keyCode == 13) {
        if (document.getElementById("message").value.length != 0 && document.getElementById("username").value.length != 0) {
            socket.emit('chat:message', {
                message: message.value,
                username: username.value
            });
            document.getElementById("message").value = "";
        }       
    }
}

socket.on('chat:message', function (data) {
    output.innerHTML +=
   `<p>
        <strong>${data.username}:</strong> ${data.message}
   </p>`
});