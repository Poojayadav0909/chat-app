import { Server } from "socket.io";
import {
    SendRoomMessageSchema,
    type SendRoomMessageData,
    type MessageResponse
} from "./types";

const io = new Server(4000);


io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("hello", (message) => {
        console.log("Hello", message);
    })

    socket.on("typing", (typeing) => {
        console.log("User typing:", typeing);
    });

    socket.on("send_message", (message) => {
        console.log("User sent message", message);
    })

    socket.on("join_room", (room) => {
        socket.join(room);
        console.log("Joined room", room);
        console.log("Rooms", socket.rooms);
    })

    socket.on(
        "send_room_message", 
        (
            data: SendRoomMessageData,
            callback: (response: MessageResponse) => void
        ) => {
            const result = SendRoomMessageSchema.safeParse(data);

            if(!result.success) {
                return callback({
                    success: false,
                    message: "Invalid message data"
                });
            }

            const validData = result.data;

            io.to(validData.room).emit(
                "new_message",
                validData.message
            );

            return callback({
                success: true
            });
        }
    );
    socket.on("disconnect", () => {
        console.log("User disconnected", socket.id);
    });
});