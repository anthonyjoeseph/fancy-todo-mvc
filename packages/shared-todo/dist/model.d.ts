import * as t from 'io-ts';
export declare const User: t.ExactC<t.TypeC<{
    id: t.NumberC;
    email: t.StringC;
    name: t.StringC;
}>>;
export declare type User = t.TypeOf<typeof User>;
export declare const Todo: t.ExactC<t.TypeC<{
    id: t.NumberC;
    text: t.StringC;
    completed: t.BooleanC;
}>>;
export declare type Todo = t.TypeOf<typeof Todo>;
