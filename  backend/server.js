const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let waitingUser = null;

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  if (waitingUser) {
    const partner = waitingUser;
    waitingUser = null;

    socket.emit("match", partner.id);
    partner.emit("match", socket.id);
  } else {
    waitingUser = socket;
  }

  socket.on("signal", (data) => {
    io.to(data.to).emit("signal", { from: socket.id, signal: data.signal });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    if (waitingUser && waitingUser.id === socket.id) waitingUser = null;
  });
});

server.listen(3000, () => console.log("Server running on port 3000"));
