import express from 'express';
import { config } from './config';
import { connectDB } from './config/db';
import reconcileRouter from './api/reconcile';
import reportRouter from './api/report';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.type('html').send(`
    <html>
      <head>
        <title>KoinX Reconciliation API</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 820px; margin: 40px auto; line-height: 1.6; padding: 0 16px; }
          .card { border: 1px solid #ddd; border-radius: 10px; padding: 18px; margin: 16px 0; }
          code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; }
          ul { padding-left: 20px; }
          .row { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
          input { padding: 8px 10px; min-width: 260px; }
          a.button, button { display: inline-block; padding: 8px 12px; border: 1px solid #333; border-radius: 8px; text-decoration: none; color: #111; background: #fff; cursor: pointer; }
          a.button:hover, button:hover { background: #f4f4f4; }
          a.button.disabled { pointer-events: none; opacity: 0.5; }
          .muted { color: #555; }
        </style>
      </head>
      <body>
        <h1>KoinX Reconciliation API</h1>
        <p class="muted">The API is running. Use the buttons and links below to test the routes quickly.</p>

        <div class="card">
          <h2>Health</h2>
          <a class="button" href="/health">Open /health</a>
        </div>

        <div class="card">
          <h2>Start Reconciliation</h2>
          <form method="post" action="/reconcile">
            <button type="submit">POST /reconcile</button>
          </form>
        </div>

        <div class="card">
          <h2>Reports</h2>
          <p class="muted">Paste a <code>runId</code> from <code>/reconcile</code> to open the report links.</p>
          <div class="row">
            <input id="runIdInput" type="text" placeholder="runId here" />
            <a id="fullReportLink" class="button disabled" href="#">Open full report</a>
            <a id="summaryLink" class="button disabled" href="#">Open summary</a>
            <a id="unmatchedLink" class="button disabled" href="#">Open unmatched</a>
          </div>
        </div>

        <script>
          const input = document.getElementById('runIdInput');
          const fullReportLink = document.getElementById('fullReportLink');
          const summaryLink = document.getElementById('summaryLink');
          const unmatchedLink = document.getElementById('unmatchedLink');

          function updateLinks() {
            const runId = (input.value || 'demo').trim();
            const hasRunId = runId.length > 0 && runId !== 'demo';

            if (hasRunId) {
              fullReportLink.href = '/report/' + encodeURIComponent(runId);
              summaryLink.href = '/report/' + encodeURIComponent(runId) + '/summary';
              unmatchedLink.href = '/report/' + encodeURIComponent(runId) + '/unmatched';
              fullReportLink.classList.remove('disabled');
              summaryLink.classList.remove('disabled');
              unmatchedLink.classList.remove('disabled');
            } else {
              fullReportLink.href = '#';
              summaryLink.href = '#';
              unmatchedLink.href = '#';
              fullReportLink.classList.add('disabled');
              summaryLink.classList.add('disabled');
              unmatchedLink.classList.add('disabled');
            }
          }

          input.addEventListener('input', updateLinks);
          updateLinks();
        </script>
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