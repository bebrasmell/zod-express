import { Request, Response } from "express";
import { z } from "zod";

export namespace ze {
  // Types

  /**
   * An express endpoint.
   */
  export type Endpoint = (req: Request, res: Response) => any;

  /**
   * An express endpoint after checking the request.
   */
  export type SafeEndpoint<TBody, TParams, TQuery, TResponse> = (req: Request<TParams, unknown, TBody, TQuery>, res: Response) => TResponse;

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
  export type PartinalCheck<TBody, TParams, TQuery> = Partial<FullCheck<TBody, TParams, TQuery>>;

  /**
   * Function that handles errors from request validation.
   * @param res express response
   * @param error zod error
   */
  export type ErrorHandler = (req: Request, res: Response, error: z.ZodError) => void;

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
 * @returns the endpoint to pass to express
 */
export function CheckBody<TBody, TRes>(
  schema: z.Schema<TBody>,
  handler: ze.SafeEndpoint<TBody, unknown, unknown, TRes>,
  config?: ze.ValidationOptions
): ze.Endpoint {
  return (req, res) => {
    const body = schema.safeParse(req.body);

    if (!body.success) {
      if (config?.errorHandler) return config.errorHandler(req, res, body.error);
      return res.status(config?.errorCode ?? 406).send(ze.getError(body.error));
    }

    return handler(req as any, res);
  };
}

/**
 * Checks request parameters against the schema.
 * @param schema zod schema to check parameters against
 * @param handler the handler to call if parameters are valid
 * @returns the endpoint to pass to express
 */
export function CheckParams<TParams extends ze.RequestDictionary, TRes>(
  schema: z.Schema<TParams>,
  handler: ze.SafeEndpoint<unknown, TParams, unknown, TRes>,
  config?: ze.ValidationOptions
): ze.Endpoint {
  return (req, res) => {
    const params = schema.safeParse(req.params);

    if (!params.success) {
      if (config?.errorHandler) return config.errorHandler(req, res, params.error);
      return res.status(config?.errorCode ?? 406).send(ze.getError(params.error));
    }

    return handler(req as any, res);
  };
}

/**
 * Checks request query against the schema.
 * @param schema zod schema to check query against
 * @param handler the handler to call if query is valid
 * @returns the endpoint to pass to express
 */
export function CheckQuery<TQuery extends ze.RequestDictionary, TRes>(
  schema: z.Schema<TQuery>,
  handler: ze.SafeEndpoint<unknown, unknown, TQuery, TRes>,
  config?: ze.ValidationOptions
): ze.Endpoint {
  return (req, res) => {
    const query = schema.safeParse(req.query);

    if (!query.success) {
      if (config?.errorHandler) return config.errorHandler(req, res, query.error);
      return res.status(config?.errorCode ?? 406).send(ze.getError(query.error));
    }

    return handler(req as any, res);
  };
}

/**
 * Checks all parts of the request against the schema.
 * @param schemas zod schemas to check request against
 * @param handler the handler to call if request is valid
 * @returns the endpoint to pass to express
 */
export function Check<TBody, TParams extends ze.RequestDictionary, TQuery extends ze.RequestDictionary, TRes>(
  schemas: ze.PartinalCheck<TBody, TParams, TQuery>,
  handler: ze.SafeEndpoint<TBody, TParams, TQuery, TRes>,
  config?: ze.ValidationOptions
): ze.Endpoint {
  return (req, res) => {
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

    return handler(req as any, res);
  };
}

// Decorators
/**
 * Decorator that checks the body of the request against the schema.
 * @param schema zod schema to check the body
 * @param config validation configuration
 * @returns class parameter decorator
 */
export function ValidateBody<TBody>(schema: z.Schema<TBody>, config?: ze.ValidationOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>
  ) {
    const original = descriptor.value;
    descriptor.value = CheckBody(schema, original, config);
    return descriptor;
  };
}

/**
 * Decorator that checks request parameters against the schema.
 * @param schema zod schema to check parameters
 * @param config validation configuration
 * @returns class parameter decorator
 */
export function ValidateParams<TParams extends ze.RequestDictionary>(schema: z.Schema<TParams>, config?: ze.ValidationOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>
  ) {
    const original = descriptor.value;
    descriptor.value = CheckParams(schema, original, config);
    return descriptor;
  };
}

/**
 * Decorator that checks request query against the schema.
 * @param schema zod schema to check query
 * @param config validation configuration
 * @returns class parameter decorator
 */
export function ValidateQuery<TQuery extends ze.RequestDictionary>(schema: z.Schema<TQuery>, config?: ze.ValidationOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>
  ) {
    const original = descriptor.value;
    descriptor.value = CheckQuery(schema, original, config);
    return descriptor;
  };
}

/**
 * Decorator that checks all parts of the request against the schema.
 * @param schemas zod schemas to check request
 * @param config validation configuration
 * @returns class parameter decorator
 */
export function Validate<TBody, TParams extends ze.RequestDictionary, TQuery extends ze.RequestDictionary>(schemas: ze.PartinalCheck<TBody, TParams, TQuery>, config?: ze.ValidationOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<any>
  ) {
    const original = descriptor.value;
    descriptor.value = Check(schemas, original, config);
    return descriptor;
  };
}
