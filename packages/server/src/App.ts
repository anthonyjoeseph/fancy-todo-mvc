import express from 'express';

import UserRouter from './routes/User';
import TodoRouter from './routes/Todo';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', UserRouter);
app.use('/api', TodoRouter);

export default app