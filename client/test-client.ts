import { io } from "socket.io-client";
import type { MessageResponse } from "./client/types";

const socket = io("http://localhost:4000");

socket.on("connect", () => {
    console.log("Connected with server:", socket.id);

    socket.emit("hello", "Message from client!");

    socket.emit("join_room", "rust");

    socket.emit(
        "send_room_message",
        {
            room: "rust",
            message: "Rust is awesome!"
        },
        (response: MessageResponse) => {
            console.log("Server response:", response);
        }
    );
});

socket.on("new_message", (message) => {
    console.log("New message:", message);
});

socket.on("disconnect", () => {
    console.log("Disconnected from server");
});