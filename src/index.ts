import express from 'express';
import { config } from './config';
import { connectDB } from './config/db';
import reconcileRouter from './api/reconcile';
import reportRouter from './api/report';

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.type('html').send(`
    <html>
      <head>
        <title>KoinX Reconciliation API</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 720px; margin: 40px auto; line-height: 1.6; }
          code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; }
          ul { padding-left: 20px; }
        </style>
      </head>
      <body>
        <h1>KoinX Reconciliation API</h1>
        <p>The API is running. Use these routes:</p>
        <ul>
          <li><a href="/health">GET /health</a></li>
          <li><code>POST /reconcile</code></li>
          <li><code>GET /report/:runId</code></li>
          <li><code>GET /report/:runId/summary</code></li>
          <li><code>GET /report/:runId/unmatched</code></li>
        </ul>
      </body>
    </html>
  `);
});

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