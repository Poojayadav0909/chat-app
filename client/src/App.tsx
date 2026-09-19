import { useEffect, useState } from "react";

import { socket } from "./socket";

import type {
    JoinRoomResponse,
    LoginResponse,
    Message,
    MessageResponse
} from "./types";

function App() {
    const [username, setUsername] = useState("");
    const [loggedIn, setLoggedIn] = useState(false);

    const [room, setRoom] = useState("rust");

    const [message, setMessage] = useState("");

    const [messages, setMessages] =
        useState<Message[]>([]);

    const [typingUser, setTypingUser] =
        useState("");

    const [connected, setConnected] =
        useState(false);

    const [error, setError] =
        useState("");

    useEffect(() => {
        socket.on("connect", () => {
            console.log(
                "Connected:",
                socket.id
            );

            setConnected(true);
        });

        socket.on("disconnect", () => {
            console.log("Disconnected");

            setConnected(false);
        });

        socket.on(
            "new_message",
            (newMessage: Message) => {
                setMessages((current) => [
                    ...current,
                    newMessage
                ]);
            }
        );

        socket.on(
            "user_typing",
            (data) => {
                setTypingUser(
                    `${data.username} is typing...`
                );
            }
        );

        socket.on(
            "user_stop_typing",
            () => {
                setTypingUser("");
            }
        );

        return () => {
            socket.off("connect");
            socket.off("disconnect");
            socket.off("new_message");
            socket.off("user_typing");
            socket.off("user_stop_typing");
        };
    }, []);

    function login() {
        if (!username.trim()) {
            setError("Enter a username");

            return;
        }

        socket.connect();

        socket.emit(
            "login",
            {
                username
            },
            (response: LoginResponse) => {

                if (!response.success) {
                    setError(response.message);

                    return;
                }

                setLoggedIn(true);
                setError("");

                joinRoom();
            }
        );
    }

    function joinRoom() {
        socket.emit(
            "join_room",
            {
                room
            },
            (response: JoinRoomResponse) => {

                if (!response.success) {
                    setError(response.message);

                    return;
                }

                setMessages(response.messages);

                setError("");
            }
        );
    }

    function sendMessage() {
        if (!message.trim()) {
            return;
        }

        const clientId =
            crypto.randomUUID();

        socket.emit(
            "send_room_message",
            {
                room,
                content: message,
                clientId
            },
            (response: MessageResponse) => {

                if (!response.success) {
                    setError(response.message);

                    return;
                }

                setMessage("");
                setError("");
            }
        );
    }

    function handleTyping(
        value: string
    ) {
        setMessage(value);

        socket.emit(
            "typing",
            {
                room
            }
        );
    }

    return (
        <div className="app">

            <h1>Real-Time Chat</h1>

            <p>
                Status:{" "}
                {connected
                    ? "🟢 Connected"
                    : "🔴 Disconnected"}
            </p>

            {!loggedIn ? (
                <div>
                    <input
                        placeholder="Username"
                        value={username}
                        onChange={(event) =>
                            setUsername(
                                event.target.value
                            )
                        }
                    />

                    <button onClick={login}>
                        Login
                    </button>
                </div>
            ) : (
                <>
                    <div>
                        <input
                            value={room}
                            onChange={(event) =>
                                setRoom(
                                    event.target.value
                                )
                            }
                        />

                        <button
                            onClick={joinRoom}
                        >
                            Join Room
                        </button>
                    </div>

                    <div className="messages">

                        {messages.map(
                            (item) => (
                                <div
                                    key={item.id}
                                    className="message"
                                >
                                    <strong>
                                        {
                                            item
                                                .sender
                                                .username
                                        }
                                    </strong>

                                    <p>
                                        {
                                            item.content
                                        }
                                    </p>
                                </div>
                            )
                        )}

                    </div>

                    <p>
                        {typingUser}
                    </p>

                    <div>
                        <input
                            value={message}
                            placeholder="Message..."
                            onChange={(event) =>
                                handleTyping(
                                    event.target.value
                                )
                            }
                            onKeyDown={(event) => {
                                if (
                                    event.key ===
                                    "Enter"
                                ) {
                                    sendMessage();
                                }
                            }}
                        />

                        <button
                            onClick={sendMessage}
                        >
                            Send
                        </button>
                    </div>
                </>
            )}

            {error && (
                <p>
                    ❌ {error}
                </p>
            )}

        </div>
    );
}

export default App;