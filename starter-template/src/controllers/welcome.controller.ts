import { Request, Response, Router } from "express";
import { SWController } from "simple-wire";

export class WelcomeController implements SWController {
  public register(router: Router): void {
    router.get("/", this.welcome);
  }

  private welcome = (_req: Request, res: Response): void => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(WELCOME_HTML);
  };
}

const WELCOME_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>simple-wire</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #0a0a0a;
      color: #ededed;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .container {
      max-width: 680px;
      width: 100%;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #888;
      margin-bottom: 1.5rem;
    }

    .dot {
      width: 6px;
      height: 6px;
      background: #22c55e;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    h1 {
      font-size: 3rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      line-height: 1.1;
      margin-bottom: 0.75rem;
    }

    h1 span {
      color: #888;
    }

    .tagline {
      font-size: 1.05rem;
      color: #888;
      line-height: 1.6;
      margin-bottom: 2.5rem;
      max-width: 520px;
    }

    .cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 2.5rem;
    }

    @media (max-width: 520px) {
      .cards { grid-template-columns: 1fr; }
      h1 { font-size: 2.2rem; }
    }

    .card {
      background: #111;
      border: 1px solid #222;
      border-radius: 10px;
      padding: 1.25rem 1.5rem;
      text-decoration: none;
      color: inherit;
      transition: border-color 0.15s, background 0.15s;
    }

    .card:hover {
      border-color: #444;
      background: #161616;
    }

    .card-title {
      font-size: 0.9rem;
      font-weight: 600;
      margin-bottom: 0.35rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .card-title .arrow {
      color: #555;
      font-size: 0.85rem;
      transition: transform 0.15s, color 0.15s;
    }

    .card:hover .arrow {
      transform: translateX(3px);
      color: #aaa;
    }

    .card-desc {
      font-size: 0.82rem;
      color: #666;
      line-height: 1.5;
    }

    .divider {
      border: none;
      border-top: 1px solid #1a1a1a;
      margin-bottom: 2rem;
    }

    .footer {
      font-size: 0.8rem;
      color: #444;
    }

    .footer a {
      color: #666;
      text-decoration: none;
    }

    .footer a:hover { color: #aaa; }

    code {
      font-family: "SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", monospace;
      font-size: 0.85em;
      background: #1a1a1a;
      border: 1px solid #2a2a2a;
      border-radius: 4px;
      padding: 0.1em 0.4em;
      color: #ccc;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="badge"><span class="dot"></span> Running in development</div>

    <h1>simple<span>-wire</span></h1>
    <p class="tagline">
      An opinionated, lightweight TypeScript backend framework built on Express.
      Your app is running — here's where to start.
    </p>

    <div class="cards">
      <div class="card">
        <div class="card-title">Controllers <span class="arrow">→</span></div>
        <div class="card-desc">
          Add routes in <code>src/controllers/</code>. Register them in
          <code>src/setup/app.ts</code>.
        </div>
      </div>

      <div class="card">
        <div class="card-title">Domain slices <span class="arrow">→</span></div>
        <div class="card-desc">
          Business logic lives in <code>src/domain/</code>. Each slice owns its
          schema, repo, and service.
        </div>
      </div>

      <div class="card">
        <div class="card-title">Configuration <span class="arrow">→</span></div>
        <div class="card-desc">
          Env vars are validated at startup in
          <code>src/setup/config.ts</code> using Zod.
        </div>
      </div>

      <div class="card">
        <div class="card-title">Database <span class="arrow">→</span></div>
        <div class="card-desc">
          Drizzle ORM is wired in <code>src/setup/db.ts</code>. Run
          <code>pnpm db:migrate</code> to apply migrations.
        </div>
      </div>
    </div>

    <hr class="divider" />

    <p class="footer">
      Remove this page by deleting <code>WelcomeController</code> from
      <code>src/setup/app.ts</code> &nbsp;·&nbsp;
      <a href="https://github.com/mfeghhi/simple-wire" target="_blank">GitHub</a>
    </p>
  </div>
</body>
</html>`;
