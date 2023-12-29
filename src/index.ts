/* eslint-disable @typescript-eslint/no-explicit-any */

import { Request, Response } from "express";
import { z } from "zod";

/**
 * zod-express types.
 */
export namespace ze {
  // Types

  /**
   * An express endpoint.
   */
  export type Endpoint = (req: Request, res: Response) => any;

  /**
   * An express endpoint after checking the request.
   */
  export type SafeEndpoint<TBody, TParams, TQuery, TResponse> = (
    req: Request<TParams, unknown, TBody, TQuery>,
    res: Response,
  ) => TResponse;

  /**
   * Request validation schemas.
   */
  export interface FullCheck<TBody, TParams, TQuery> {
    body: z.Schema<TBody>;
    params: z.Schema<TParams>;
    query: z.Schema<TQuery>;
  }

  /**
   * Request validation schemas.
   */
  export type PartinalCheck<TBody, TParams, TQuery> = Partial<
    FullCheck<TBody, TParams, TQuery>
  >;

  /**
   * Function that handles errors from request validation.
   * @param res express response
   * @param error zod error
   */
  export type ErrorHandler = (
    req: Request,
    res: Response,
    error: z.ZodError,
  ) => void;

  /**
   * Request validation configuration.
   */
  export interface CheckConfig {
    errorCode: number;
    errorHandler: ErrorHandler;
  }

  /**
   * Request validation options.
   */
  export type ValidationOptions = Partial<CheckConfig>;

  /**
   * Request params/query Dictionary.
   */
  export type RequestDictionary = { [key: string]: string };

  // Functions
  /**
   * Gets the first error message from a zod error.
   * @param errors zod error
   * @returns error message
   */
  export function getError(errors: z.ZodError): string {
    return errors.errors[0].message;
  }

  /**
   * Default error handler.
   * @param res express response
   * @param error zod error
   */
  export function defaultErrorHandler(res: Response, error: z.ZodError): void {
    res.status(406).send(getError(error));
  }
}

// Functions

/**
 * Checks the body of the request against the schema.
 * @param schema zod schema to check the body against
 * @param handler the handler to call if the body is valid
 * @param config validation configuration (optional)
 * @returns the endpoint to pass to express
 *
 * @example
 * import { z } from "zod";
 * import { CheckBody } from "@zodyac/express";
 *
 * const schema = z.object({
 *  name: z.string(),
 *  age: z.number().int().min(18),
 * });
 *
 * app.post("/", CheckBody(schema, (req, res) => {
 *   const { name, age } = req.body;
 *   return res.send(`Hello, ${name}! You are ${age} years old.`);
 * }));
 */
export function CheckBody<TBody, TRes>(
  schema: z.Schema<TBody>,
  handler: ze.SafeEndpoint<TBody, unknown, unknown, TRes>,
  config?: ze.ValidationOptions,
): ze.Endpoint {
  return (req, res) => {
    const body = schema.safeParse(req.body);

    if (!body.success) {
      if (config?.errorHandler)
        return config.errorHandler(req, res, body.error);
      return res.status(config?.errorCode ?? 406).send(ze.getError(body.error));
    }

    return handler(req as any, res);
  };
}

/**
 * Checks request parameters against the schema.
 * @param schema zod schema to check parameters against
 * @param handler the handler to call if parameters are valid
 * @param config validation configuration (optional)
 * @returns the endpoint to pass to express
 *
 * @example
 * import { z } from "zod";
 * import { CheckParams } from "@zodyac/express";
 *
 * const schema = z.object({
 *   id: z.string().uuid(),
 * });
 *
 * app.get("/:id", CheckParams(schema, (req, res) => {
 *  const { id } = req.params;
 *  return res.send(`Hello from ${id}!`);
 * }));
 */
export function CheckParams<TParams extends ze.RequestDictionary, TRes>(
  schema: z.Schema<TParams>,
  handler: ze.SafeEndpoint<unknown, TParams, unknown, TRes>,
  config?: ze.ValidationOptions,
): ze.Endpoint {
  return (req, res) => {
    const params = schema.safeParse(req.params);

    if (!params.success) {
      if (config?.errorHandler)
        return config.errorHandler(req, res, params.error);
      return res
        .status(config?.errorCode ?? 406)
        .send(ze.getError(params.error));
    }

    return handler(req as any, res);
  };
}

/**
 * Checks request query against the schema.
 * @param schema zod schema to check query against
 * @param handler the handler to call if query is valid
 * @param config validation configuration (optional)
 * @returns the endpoint to pass to express
 *
 * @example
 * import { z } from "zod";
 * import { CheckQuery } from "@zodyac/express";
 *
 * const schema = z.object({
 *  page: z.number().int().positive().default(1),
 *  pageSize: z.number().min(1).max(100).default(10),
 * });
 *
 * app.get("/", CheckQuery(schema, (req, res) => {
 *   const { page, pageSize } = req.query;
 *   return res.send(`Page ${page} contains ${pageSize} records.`);
 * }));
 */
export function CheckQuery<TQuery extends ze.RequestDictionary, TRes>(
  schema: z.Schema<TQuery>,
  handler: ze.SafeEndpoint<unknown, unknown, TQuery, TRes>,
  config?: ze.ValidationOptions,
): ze.Endpoint {
  return (req, res) => {
    const query = schema.safeParse(req.query);

    if (!query.success) {
      if (config?.errorHandler)
        return config.errorHandler(req, res, query.error);
      return res
        .status(config?.errorCode ?? 406)
        .send(ze.getError(query.error));
    }

    return handler(req as any, res);
  };
}

/**
 * Checks all parts of the request against the schema.
 * @param schemas zod schemas to check request against
 * @param handler the handler to call if request is valid
 * @param config validation configuration (optional)
 * @returns the endpoint to pass to express
 *
 * @example
 * import { z } from "zod";
 * import { Check } from "@zodyac/express";
 *
 * const schema = {
 *   body: z.object({
 *     name: z.string(),
 *     age: z.number().min(18).int(),
 *   }),
 *   params: z.object({
 *    id: z.string().uuid(),
 *   }),
 * };
 *
 * app.put("/:id", Check(schema, (req, res) => {
 *  const { name, age } = req.body;
 *  const { id } = req.params;
 *  return res.send(`Hello, ${name}! You are ${age} years old. Your id is ${id}.`);
 * }));
 */
export function Check<
  TBody,
  TParams extends ze.RequestDictionary,
  TQuery extends ze.RequestDictionary,
  TRes,
>(
  schemas: ze.PartinalCheck<TBody, TParams, TQuery>,
  handler: ze.SafeEndpoint<TBody, TParams, TQuery, TRes>,
  config?: ze.ValidationOptions,
): ze.Endpoint {
  return (req, res) => {
    const body = schemas.body?.safeParse(req.body);
    const params = schemas.params?.safeParse(req.params);
    const query = schemas.query?.safeParse(req.query);

    if (body && !body.success) {
      if (config?.errorHandler)
        return config.errorHandler(req, res, body.error);
      return res.status(config?.errorCode ?? 406).send(ze.getError(body.error));
    }

    if (params && !params.success) {
      if (config?.errorHandler)
        return config.errorHandler(req, res, params.error);
      return res
        .status(config?.errorCode ?? 406)
        .send(ze.getError(params.error));
    }

    if (query && !query.success) {
      if (config?.errorHandler)
        return config.errorHandler(req, res, query.error);
      return res
        .status(config?.errorCode ?? 406)
        .send(ze.getError(query.error));
    }

    return handler(req as any, res);
  };
}

// Decorators
/**
 * Decorator that checks the body of the request against the schema.
 * @param schema zod schema to check the body
 * @param config validation configuration (optional)
 * @returns class parameter decorator
 *
 * @example
 * import { z } from "zod";
 * import { ValidateBody } from "@zodyac/express";
 *
 * const schema = z.object({
 *   name: z.string(),
 *   age: z.number().min(18).int(),
 * });
 *
 * class Controller {
 *   @ ValidateBody(schema)
 *   static post(req, res) {
 *     const { name, age } = req.body;
 *     return res.send(`Hello, ${name}! You are ${age} years old.`);
 *   }
 * }
 */
export function ValidateBody<TBody>(
  schema: z.Schema<TBody>,
  config?: ze.ValidationOptions,
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>,
  ) {
    const original = descriptor.value;
    descriptor.value = CheckBody(schema, original, config);
    return descriptor;
  };
}

/**
 * Decorator that checks request parameters against the schema.
 * @param schema zod schema to check parameters
 * @param config validation configuration (optional)
 * @returns class parameter decorator
 *
 * @example
 * import { z } from "zod";
 * import { ValidateParams } from "@zodyac/express";
 *
 * const schema = z.object({
 *   id: z.string().uuid(),
 * });
 *
 * class Controller {
 *   @ ValidateParams(schema)
 *   static get(req: Request, res: Response) {
 *     const { id } = req.params as z.infer<typeof schema>;
 *     return res.send(`Hello from ${id}!`);
 *   }
 * }
 */
export function ValidateParams<TParams extends ze.RequestDictionary>(
  schema: z.Schema<TParams>,
  config?: ze.ValidationOptions,
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>,
  ) {
    const original = descriptor.value;
    descriptor.value = CheckParams(schema, original, config);
    return descriptor;
  };
}

/**
 * Decorator that checks request query against the schema.
 * @param schema zod schema to check query
 * @param config validation configuration (optional)
 * @returns class parameter decorator
 *
 * @example
 * import { z } from "zod";
 * import { ValidateQuery } from "@zodyac/express";
 *
 * const schema = z.object({
 *   page: z.number().int().positive().default(1),
 *   pageSize: z.number().int().min(1).max(100).default(10),
 * });
 *
 * class Controller {
 *   @ ValidateQuery(schema)
 *   static get(req: Request, res: Response) {
 *     const { page, pageSize } = req.query as z.infer<typeof schema>;
 *     return res.send(`Page ${page} contains ${pageSize} records.`);
 *   }
 * }
 */
export function ValidateQuery<TQuery extends ze.RequestDictionary>(
  schema: z.Schema<TQuery>,
  config?: ze.ValidationOptions,
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>,
  ) {
    const original = descriptor.value;
    descriptor.value = CheckQuery(schema, original, config);
    return descriptor;
  };
}

/**
 * Decorator that checks all parts of the request against the schema.
 * @param schemas zod schemas to check request
 * @param config validation configuration (optional)
 * @returns class parameter decorator
 *
 * @example
 * import { z } from "zod";
 * import { Validate } from "@zodyac/express";
 *
 * const schema = {
 *   body: z.object({
 *     name: z.string(),
 *     age: z.number().int().min(18),
 *   }),
 *   params: z.object({
 *     id: z.string().uuid(),
 *   }),
 * };
 *
 * class Controller {
 *   @ Validate(schema)
 *   static put(req: Request, res: Response) {
 *     const { name, age } = req.body as z.infer<typeof schema.body>;
 *     const { id } = req.params as z.infer<typeof schema.params>;
 *     return res.send(`Hello, ${name}! You are ${age} years old. Your id is ${id}.`);
 *   }
 * }
 */
export function Validate<
  TBody,
  TParams extends ze.RequestDictionary,
  TQuery extends ze.RequestDictionary,
>(
  schemas: ze.PartinalCheck<TBody, TParams, TQuery>,
  config?: ze.ValidationOptions,
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>,
  ) {
    const original = descriptor.value;
    descriptor.value = Check(schemas, original, config);
    return descriptor;
  };
}

// Middlewares
export * from "./middleware.js";
