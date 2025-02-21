import { Schema } from 'mongoose';

export interface IUser
{
    id?: number,
    name: string,
    chat_id: number,
    city: string|undefined,
    phone?: number|undefined,
    join_code?: string|undefined
    ref_code: string,
}

export const UserSchema = new Schema<IUser>
({
    id: { type: Number, required: false },
    name: { type: String, required: false },
    chat_id: { type: Number, required: true },
    city: { type: String, required: false },
    phone: { type: Number, required: false },
    join_code: { type: String, required: false },
    ref_code: { type: String, required: true },
});
