import { RequestHandler } from "express";
import { ze } from "./index.js";
import { z } from "zod";

/**
 * Middleware for express that checks the request against the schema.
 */
export namespace zem {
  /**
   * Middleware for express that checks the request body against the schema.
   * @param schema zod schema to check the body
   * @param config validation configuration (optional)
   * @returns
   */
  export function Body<T>(
    schema: z.Schema<T>,
    config?: ze.ValidationOptions,
  ): RequestHandler {
    return (req, res, next) => {
      const body = schema.safeParse(req.body);

      if (!body.success) {
        if (config?.errorHandler)
          return config.errorHandler(req, res, body.error);
        return res
          .status(config?.errorCode ?? 406)
          .send(ze.getError(body.error));
      }

      next();
    };
  }

  /**
   * Middleware for express that checks the request parameters against the schema.
   * @param schema zod schema to check the parameters
   * @param config validation configuration (optional)
   * @returns
   */
  export function Params<T extends ze.RequestDictionary>(
    schema: z.Schema<T>,
    config?: ze.ValidationOptions,
  ): RequestHandler {
    return (req, res, next) => {
      const params = schema.safeParse(req.params);

      if (!params.success) {
        if (config?.errorHandler)
          return config.errorHandler(req, res, params.error);
        return res
          .status(config?.errorCode ?? 406)
          .send(ze.getError(params.error));
      }

      next();
    };
  }

  /**
   * Middleware for express that checks the request query against the schema.
   * @param schema zod schema to check the query
   * @param config validation configuration (optional)
   * @returns
   */
  export function Query<T extends ze.RequestDictionary>(
    schema: z.Schema<T>,
    config?: ze.ValidationOptions,
  ): RequestHandler {
    return (req, res, next) => {
      const query = schema.safeParse(req.query);

      if (!query.success) {
        if (config?.errorHandler)
          return config.errorHandler(req, res, query.error);
        return res
          .status(config?.errorCode ?? 406)
          .send(ze.getError(query.error));
      }

      next();
    };
  }

  /**
   * Middleware for express that checks the request against the schema.
   * @param schemas zod schemas to check the request
   * @param config validation configuration (optional)
   * @returns
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
        if (config?.errorHandler)
          return config.errorHandler(req, res, body.error);
        return res
          .status(config?.errorCode ?? 406)
          .send(ze.getError(body.error));
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

      next();
    };
  }
}
