import { z } from "zod";

export const SendRoomMessageSchema = z.object({
    room: z.string().min(1),
    message: z.string().min(1).max(500)
})

export type SendRoomMessageData = 
    z.infer<typeof SendRoomMessageSchema>;



export type MessageResponse = 
    | {
        success: true;
    }
    |   {
        success: false;
        message: string;
    };

    