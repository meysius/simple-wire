import "dotenv/config";
import express, { Router, Request, Response, NextFunction } from "express";
import { buildApp } from "@/setup/app";
import { AsyncContext } from "@/setup/async-context";

const app = buildApp();

const expressApp = express();
expressApp.use(express.json());

expressApp.use((req: Request, _res: Response, next: NextFunction) => {
  app.asyncStorage.run(new AsyncContext(req), () => next());
});

const router = Router();
for (const controller of app.controllers) {
  controller.register(router);
}
expressApp.use(router);

const server = expressApp.listen(app.cfg.PORT, () => {
  app.logger.info(`Service started on port ${app.cfg.PORT}.`);
});

const shutdown = async () => {
  app.logger.info("SIGTERM received. Shutting down gracefully...");
  server.close(async () => {
    await app.shutdown();
    app.logger.info("Closed out remaining connections.");
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
