import { Schema } from 'mongoose';

export interface IMessage
{
    message_id: number,
    balance: number,
    chat_id: number,
}

export const MessageSchema = new Schema<IMessage>
({
    message_id: { type: Number, required: false },
    chat_id: { type: Number, required: true },
    balance: { type: Number, required: false },
});
