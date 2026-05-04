import { Router } from "express";

export interface SWController {
  register(router: Router): void;
}
