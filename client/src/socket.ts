import { io } from "socket.io-client";

export const socket = io(
    "http://localhost:4000",
    {
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000
    }
);