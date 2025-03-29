import { config } from 'dotenv';
import express, { json } from 'express';

import testRoutes from './routes/test.route.js';

config();

const app = express();

app.use(json());
app.use('/api', testRoutes)

app.get('/', (req, res) => res.status(200).json({message: 'Workspace backend running!'}));


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at port ${PORT}`));