import { config } from 'dotenv';
import express, { json } from 'express';

import authRoutes from './routes/auth.route.js';

config();

const app = express();

app.use(json());
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => res.status(200).json({message: 'Workspace backend running!'}));


export default app;