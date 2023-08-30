const crypto = require("crypto");

function generatePassKey() {
  return crypto.randomBytes(32);
}

function generateIV() {
  return crypto.randomBytes(16);
}

function generateEncryptedMessage(data) {
  const passKey = generatePassKey();
  const iv = generateIV();

  const cipher = crypto.createCipheriv("aes-256-ctr", passKey, iv);
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(data), "utf8"),
    cipher.final(),
  ]);

  return `${encrypted.toString("hex")}|${passKey.toString("hex")}|${iv.toString(
    "hex"
  )}`;
}

function generateData() {
  const names = ["Jack Reacher", "John Wick", "James Bond"];
  const origins = ["Bengaluru", "Mumbai", "New York"];
  const destinations = ["Mumbai", "New York", "London"];

  return {
    name: getRandomItem(names),
    origin: getRandomItem(origins),
    destination: getRandomItem(destinations),
  };
}

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function startEmitter(socket) {
  const emitData = () => {
    const messages = [];

    const numMessages = Math.floor(Math.random() * (499 - 49 + 1)) + 49;
    for (let i = 0; i < numMessages; i++) {
      const data = generateData();
      const encryptedMessage = generateEncryptedMessage(data);
      messages.push(encryptedMessage);
    }

    const dataStream = messages.join("|");
    socket.emit("dataStream", dataStream);

    setImmediate(() => {
      setTimeout(emitData, 10000); // Schedule the next emit after 10 seconds
    });
  };

  emitData(); // Start emitting data
}

module.exports = startEmitter;
