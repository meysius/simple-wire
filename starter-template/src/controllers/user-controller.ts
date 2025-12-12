import { IController, ILogger, RouteDefinition } from "simple-wire";
import { Request, Response } from "express";
import { AuthService } from "@/services/auth-service";

type UserControllerDeps = {
  authService: AuthService,
  logger: ILogger
};

export class UserController implements IController {
  private readonly authService: AuthService;
  private readonly logger: ILogger;

  constructor({ authService, logger }: UserControllerDeps) {
    this.authService = authService;
    this.logger = logger;
  }

  public getRoutes(): RouteDefinition[] {
    return [
      {
        method: "get",
        path: "/users",
        handler: this.listUsers,
      },
    ];
  }

  private async listUsers(req: Request, res: Response): Promise<void> {
    this.logger.info("Fetching user list");
    const users = await this.authService.listAllUsers();
    res.json(users);
  }
}