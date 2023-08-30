const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const crypto = require("crypto");
const mongoose = require("mongoose");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/timeseriesdb", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const TimeSeries = mongoose.model(
  "TimeSeries",
  new mongoose.Schema({ data: Object })
);

io.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("dataStream", async (dataStream) => {
    const encryptedMessages = dataStream.split("|");

    const processedMessages = [];
    for (const encryptedMessage of encryptedMessages) {
      try {
        const [encryptedText, passKeyHex, ivHex] = encryptedMessage.split("|");

        try {
          const passKey = Buffer.from(passKeyHex, "hex");
          const iv = Buffer.from(ivHex, "hex");

          const decipher = crypto.createDecipheriv("aes-256-ctr", passKey, iv);
          const decrypted = Buffer.concat([
            decipher.update(Buffer.from(encryptedText, "hex")),
            decipher.final(),
          ]);
          const payload = JSON.parse(decrypted.toString("utf8"));

          // Store payload in MongoDB
          const timeSeriesData = new TimeSeries({
            data: {
              name: payload.name,
              origin: payload.origin,
              destination: payload.destination,
              timestamp: new Date(),
            },
          });
          await timeSeriesData.save();

          processedMessages.push(payload);
        } catch (decryptionError) {
          console.error("Error decrypting message:", decryptionError);
        }
      } catch (splitError) {
        console.error("Error splitting message parts:", splitError);
      }
    }

    const successRate =
      (processedMessages.length / encryptedMessages.length) * 100;
    console.log("Success Rate:", successRate.toFixed(2) + "%");
    io.emit("newData", { data: processedMessages, successRate });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Listener service is running on port ${PORT}`);
});

module.exports = app; // Export the Express app
