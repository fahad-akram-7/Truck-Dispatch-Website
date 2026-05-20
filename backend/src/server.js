import http from "http";
import { Server } from "socket.io";
import app from "./app.js";

const PORT = Number(process.env.PORT || 5000);
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

io.on("connection", (socket) => {
  socket.emit("connected", { message: "Realtime channel connected" });
});

app.set("io", io);

app.get("/", (req, res) => {
  res.send("Truck Dispatch Backend is running");
});

server.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
