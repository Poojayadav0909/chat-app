import "dotenv/config";

import { Server } from "socket.io";

import { prisma } from "./db";
import { LoginSchema, JoinRoomSchema, SendMessageSchema } from "./types";
import { getUserId } from "./auth";
import { isRateLimited } from "./rate-limit";

const io = new Server(4000, {
    cors: {
        origin: "http://localhost:5173"
    }
});

console.log("Socket.IO server running on port 4000");

io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("login", async (data, callback) => {
        const result = LoginSchema.safeParse(data);

        if (!result.success) {
            return callback({
                success: false,
                message: "Invalid username"
            });
        }

        const username = result.data.username;

        try {
            const user = await prisma.user.upsert({
                where: {
                    username
                },

                update: {},

                create: {
                    username
                }
            });

            socket.data.userId = user.id;
            socket.data.username = user.username;

            callback({
                success: true,
                user: {
                    id: user.id,
                    username: user.username
                }
            });

            console.log("User logged in:", username);

        } catch (error) {
            console.error("Login error:", error);

            callback({
                success: false,
                message: "Login failed"
            });
        }
    });

    socket.on("join_room", async (data, callback) => {
        try {
            const userId = getUserId(socket);

            const result = JoinRoomSchema.safeParse(data);

            if (!result.success) {
                return callback({
                    success: false,
                    message: "Invalid room"
                });
            }

            const roomName = result.data.room;

            const room = await prisma.room.upsert({
                where: {
                    name: roomName
                },

                update: {},

                create: {
                    name: roomName
                }
            });

            socket.join(room.name);

            const messages = await prisma.message.findMany({
                where: {
                    roomId: room.id
                },

                orderBy: {
                    createdAt: "asc"
                },

                take: 50,

                include: {
                    sender: {
                        select: {
                            id: true,
                            username: true
                        }
                    }
                }
            });

            callback({
                success: true,
                room: room.name,
                messages
            });

            console.log(
                `User ${userId} joined ${room.name}`
            );

        } catch (error) {
            console.error("Join room error:", error);

            callback({
                success: false,
                message: "Could not join room"
            });
        }
    });

    socket.on(
        "send_room_message",
        async (data, callback) => {
            try {
                const userId = getUserId(socket);

                if (isRateLimited(userId)) {
                    return callback({
                        success: false,
                        message: "Too many messages"
                    });
                }

                const result =
                    SendMessageSchema.safeParse(data);

                if (!result.success) {
                    return callback({
                        success: false,
                        message: "Invalid message"
                    });
                }

                const {
                    room,
                    content,
                    clientId
                } = result.data;

                const roomRecord =
                    await prisma.room.findUnique({
                        where: {
                            name: room
                        }
                    });

                if (!roomRecord) {
                    return callback({
                        success: false,
                        message: "Room does not exist"
                    });
                }

                const message =
                    await prisma.message.create({
                        data: {
                            clientId,
                            content,
                            senderId: userId,
                            roomId: roomRecord.id
                        },

                        include: {
                            sender: {
                                select: {
                                    id: true,
                                    username: true
                                }
                            }
                        }
                    });

                io.to(room).emit(
                    "new_message",
                    message
                );

                callback({
                    success: true,
                    messageId: message.id
                });

            } catch (error: any) {

                if (
                    error?.code === "P2002"
                ) {
                    return callback({
                        success: false,
                        message: "Duplicate message"
                    });
                }

                console.error(
                    "Message error:",
                    error
                );

                callback({
                    success: false,
                    message: "Could not send message"
                });
            }
        }
    );

    socket.on("typing", (data) => {
        try {
            getUserId(socket);

            const result = JoinRoomSchema.safeParse(data);

            if (!result.success) {
                return;
            }

            socket
                .to(result.data.room)
                .emit("user_typing", {
                    username: socket.data.username,
                    room: result.data.room
                });

        } catch {
            return;
        }
    });

    socket.on("stop_typing", (data) => {
        try {
            getUserId(socket);

            const result = JoinRoomSchema.safeParse(data);

            if (!result.success) {
                return;
            }

            socket
                .to(result.data.room)
                .emit("user_stop_typing", {
                    username: socket.data.username,
                    room: result.data.room
                });

        } catch {
            return;
        }
    });

    socket.on("disconnect", (reason) => {
        console.log(
            "Socket disconnected:",
            socket.id,
            reason
        );
    });
});