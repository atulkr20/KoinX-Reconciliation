import express from 'express';
import { config } from './config';
import { connectDB } from './config/db';
import reconcileRouter from './api/reconcile';
import reportRouter from './api/report';

const app = express();
app.use(express.json());

app.use('/', reconcileRouter);
app.use('/', reportRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const start = async () => {
  await connectDB();
  app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`);
  });
};

start();