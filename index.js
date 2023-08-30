const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const emitter = require("./emitter");
const listener = require("./listener");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.get("/", (req, res) => {
  res.send("Backend is running.");
});

// Connect the emitter to the frontend
io.on("connection", (socket) => {
  console.log("Client connected to index.js");
  emitter(socket); // Call the emitter function and pass the socket
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Backend server is running on port ${PORT}`);
});
