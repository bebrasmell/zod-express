import type { RequestHandler } from "express";
import type { z } from "zod";
import { ze } from "./index.js";

/**
 * Middleware for express that checks the request against the schema.
 */
export namespace zem {
  /**
   * Middleware for express that checks the request body against the schema.
   * @param schema zod schema to check the body
   * @param config validation configuration (optional)
   * @returns
   *
   * @example
   * import { zem } from "@zodyac/zod-express";
   * import { z } from "zod";
   *
   * const schema = z.object({
   *   name: z.string(),
   *   age: z.number(),
   * });
   *
   * app.post("/", zem.Body(schema), (req, res) => {
   *  const { name, age } = req.body as z.infer<typeof schema>;
   *  return res.send(`Hello, ${name}! You are ${age} years old!`);
   * });
   */
  export function Body<T>(
    schema: z.Schema<T>,
    config?: ze.ValidationOptions,
  ): RequestHandler {
    return (req, res, next) => {
      const body = schema.safeParse(req.body);

      if (!body.success) {
        if (config?.errorHandler) return config.errorHandler(req, res, body.error);
        return res.status(config?.errorCode ?? 406).send(ze.getError(body.error));
      }

      next();
    };
  }

  /**
   * Middleware for express that checks the request parameters against the schema.
   * @param schema zod schema to check the parameters
   * @param config validation configuration (optional)
   * @returns
   *
   * @example
   * import { zem } from "@zodyac/zod-express";
   * import { z } from "zod";
   *
   * const schema = z.object({
   *  id: z.string().uuid(),
   * });
   *
   * app.get("/:id", zem.Params(schema), (req, res) => {
   *   const { id } = req.params as z.infer<typeof schema>;
   *   return res.send(`Hello from ${id}!`);
   * });
   */
  export function Params<T extends ze.RequestDictionary>(
    schema: z.Schema<T>,
    config?: ze.ValidationOptions,
  ): RequestHandler {
    return (req, res, next) => {
      const params = schema.safeParse(req.params);

      if (!params.success) {
        if (config?.errorHandler) return config.errorHandler(req, res, params.error);
        return res.status(config?.errorCode ?? 406).send(ze.getError(params.error));
      }

      next();
    };
  }

  /**
   * Middleware for express that checks the request query against the schema.
   * @param schema zod schema to check the query
   * @param config validation configuration (optional)
   * @returns
   *
   * @example
   * import { zem } from "@zodyac/zod-express";
   * import { z } from "zod";
   *
   * const schema = z.object({
   *  page: z.number().int().positive().default(1),
   * });
   *
   * app.get("/", zem.Query(schema), (req, res) => {
   *  const { page } = req.query as z.infer<typeof schema>;
   *  return res.send(`Hello from page ${page}!`);
   * });
   */
  export function Query<T extends ze.RequestDictionary>(
    schema: z.Schema<T>,
    config?: ze.ValidationOptions,
  ): RequestHandler {
    return (req, res, next) => {
      const query = schema.safeParse(req.query);

      if (!query.success) {
        if (config?.errorHandler) return config.errorHandler(req, res, query.error);
        return res.status(config?.errorCode ?? 406).send(ze.getError(query.error));
      }

      next();
    };
  }

  /**
   * Middleware for express that checks the request against the schema.
   * @param schemas zod schemas to check the request
   * @param config validation configuration (optional)
   * @returns
   *
   * @example
   * import { zem } from "@zodyac/zod-express";
   * import { z } from "zod";
   *
   * const schemas = {
   *   body: z.object({
   *     name: z.string(),
   *     age: z.number(),
   *   }),
   *   params: z.object({
   *     id: z.string().uuid(),
   *   }),
   * };
   *
   * app.post("/:id", zem.Check(schemas), (req, res) => {
   *   const { name, age } = req.body as z.infer<typeof schemas.body>;
   *   const { id } = req.params as z.infer<typeof schemas.params>;
   *   return res.send(`Hello, ${name}! You are ${age} years old! Your id is ${id}!`);
   * });
   */
  export function Check<
    TBody,
    TParams extends ze.RequestDictionary,
    TQuery extends ze.RequestDictionary,
  >(
    schemas: ze.PartinalCheck<TBody, TParams, TQuery>,
    config?: ze.ValidationOptions,
  ): RequestHandler {
    return (req, res, next) => {
      const body = schemas.body?.safeParse(req.body);
      const params = schemas.params?.safeParse(req.params);
      const query = schemas.query?.safeParse(req.query);

      if (body && !body.success) {
        if (config?.errorHandler) return config.errorHandler(req, res, body.error);
        return res.status(config?.errorCode ?? 406).send(ze.getError(body.error));
      }

      if (params && !params.success) {
        if (config?.errorHandler) return config.errorHandler(req, res, params.error);
        return res.status(config?.errorCode ?? 406).send(ze.getError(params.error));
      }

      if (query && !query.success) {
        if (config?.errorHandler) return config.errorHandler(req, res, query.error);
        return res.status(config?.errorCode ?? 406).send(ze.getError(query.error));
      }

      next();
    };
  }
}
