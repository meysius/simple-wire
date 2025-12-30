import { Request, Response } from "express";
import { IController, ILogger, RouteDefinition } from "simple-wire";
import { IIdentityService } from "@/domain/identity/identity.service";

type Props = {
  logger: ILogger;
  identityService: IIdentityService;
};

export class UsersController implements IController {
  private readonly logger: ILogger;
  private readonly identityService: IIdentityService;

  constructor({ identityService, logger }: Props) {
    this.identityService = identityService;
    this.logger = logger;
  }

  public getRoutes(): RouteDefinition[] {
    return [
      {
        method: "post",
        path: "/users",
        handler: this.createUser,
      },
      {
        method: "get",
        path: "/users",
        handler: this.listUsers,
      },
    ];
  }

  private async listUsers(req: Request, res: Response): Promise<void> {
    this.logger.info("UsersController.listUsers called");
    const users = await this.identityService.listAllUsers();
    res.json(users);
  }

  private async createUser(req: Request, res: Response): Promise<void> {
    this.logger.info("UsersController.createUser called");
    await this.identityService.createUser(req.body);
    res.status(201).send();
  }
}