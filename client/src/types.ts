export type User = {
    id: string;
    username: string;
};

export type Message = {
    id: string;
    clientId: string;
    content: string;
    createdAt: string;

    senderId: string;

    sender: User;
};

export type LoginResponse =
    | {
        success: true;
        user: User;
      }
    | {
        success: false;
        message: string;
      };

export type JoinRoomResponse =
    | {
        success: true;
        room: string;
        messages: Message[];
      }
    | {
        success: false;
        message: string;
      };

export type MessageResponse =
    | {
        success: true;
        messageId: string;
      }
    | {
        success: false;
        message: string;
      };