import { RequestHandler } from "express";

export type HttpMethod = 'get' | 'post' | 'put' | 'delete' | 'patch';

export interface RouteDefinition {
  path: string;
  method: HttpMethod;
  handler: RequestHandler;
}

export interface SWController {
  getRoutes(): RouteDefinition[];
}

// Think about adding configuration for parsing body, query and params
// export interface ValidationSchema {
//   body?: z.ZodSchema;
//   query?: z.ZodSchema;
//   params?: z.ZodSchema;
// }

// export interface RouteDefinition {
//   path: string;
//   method: HttpMethod;
//   handler: RequestHandler;
//   schema?: ValidationSchema; // Add this
// }