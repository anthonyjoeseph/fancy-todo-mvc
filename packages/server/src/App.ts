import express from 'express';

import UserRouter from './routes/User';
import TodoRouter from './routes/Todo';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/user', UserRouter);
app.use('/api/todo', TodoRouter);

export default app