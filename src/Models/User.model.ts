import { Schema } from 'mongoose';

export interface IUser
{
    id?: number,
    name: string,
    chat_id: number,
    phone?: number|undefined,
    join_code?: string|undefined
    ref_code: string,
}

export const UserSchema = new Schema<IUser>
({
    id: { type: Number, required: false },
    name: { type: String, required: true },
    chat_id: { type: Number, required: true },
    phone: { type: Number, required: false },
    join_code: { type: String, required: false },
    ref_code: { type: String, required: true },
});
