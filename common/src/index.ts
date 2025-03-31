import { title } from 'process';
import z from 'zod';

export const signupInput = z.object({
    email:z.string().email(),
    password:z.string().min(6),
    name: z.string().optional()
})

export const signinInput = z.object({
    email: z.string().email(),
    password : z.string().min(6)
})

export const postInput = z.object({
    title :z.string().max(100),
    content :z.string(),
    published:z.boolean()
})



export const updatepost  = postInput.extend({
    title:z.string().max(100).optional(),
    id:z.string().optional(),
    content:z.string().optional(),
    authorId:z.string().optional(),
    published:z.boolean().optional()
})
export type signupInput  = z.infer<typeof signupInput>;
export type signinInput = z.infer<typeof signinInput>;
export type postInput = z.infer <typeof postInput>;
export type updatepost  = z.infer<typeof updatepost>

