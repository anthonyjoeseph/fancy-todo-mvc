import * as t from 'io-ts';
export declare const LoginUser: t.ExactC<t.TypeC<{
    email: t.StringC;
    password: t.StringC;
}>>;
export declare const loginUserEndpoint = "/user";
export declare const AddUser: t.ExactC<t.TypeC<{
    email: t.StringC;
    password: t.StringC;
    name: t.StringC;
}>>;
export declare const addUserEndpoint = "/user/add";
export declare const DeleteUser: t.ExactC<t.TypeC<{
    userid: t.NumberC;
    password: t.StringC;
}>>;
export declare const deleteUserEndpoint = "/user/delete";
export declare const GetTodos: t.ExactC<t.TypeC<{
    userid: t.NumberC;
}>>;
export declare const getTodosEndpoint = "/todo";
export declare const ToggleTodoComplete: t.ExactC<t.TypeC<{
    todoid: t.NumberC;
}>>;
export declare const toggleCompleteEndpoint = "/todo/toggle-complete";
export declare const AddTodo: t.ExactC<t.TypeC<{
    userid: t.NumberC;
    text: t.StringC;
}>>;
export declare const addTodoEndpoint = "/todo/add";
export declare const DeleteTodo: t.ExactC<t.TypeC<{
    todoid: t.NumberC;
}>>;
export declare const deleteTodoEndpoint = "/todo/delete";
