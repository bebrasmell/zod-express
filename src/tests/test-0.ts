import { Check, CheckBody, CheckParams, CheckQuery, Validate, ValidateBody, ValidateParams, ValidateQuery, ze } from "../index.js";
import { Request, Response } from "express";
import { z } from "zod";

const zSchema = z.object({
  name: z.string(),
  age: z.number(),
});
const zParams = z.object({ id: z.coerce.string() });
const zQuery = z.object({ sort: zSchema.keyof() });

CheckBody(zSchema, (req, res) => {
  const body = req.body;
  res.json(body);
});

CheckParams(zParams, (req, res) => {
  const params = req.params;
  res.json(params);
});

CheckQuery(zQuery, (req, res) => {
  const query = req.query;
  res.json(query);
});

Check(
  {
    body: zSchema,
    params: zParams,
    query: zQuery,
  },
  (req, res) => {
    const body = req.body;
    const params = req.params;
    const query = req.query;
    res.json({ body, params, query });
  }
);

class Example {
  @ValidateBody(zSchema)
  create(req: Request, res: Response) {
    const body = req.body as z.infer<typeof zSchema>;
    return res.json(body);
  }

  @ValidateParams(zParams)
  get(req: Request, res: Response) {
    const params = req.params as z.infer<typeof zParams>;
    return res.json(params);
  }

  @ValidateQuery(zQuery)
  find(req: Request, res: Response) {
    const query = req.query as z.infer<typeof zQuery>;
    return res.json(query);
  }


  @Validate({
    body: zSchema,
    params: zParams,
    query: zQuery,
  })
  update(req: Request, res: Response) {
    const body = req.body as z.infer<typeof zSchema>;
    const params = req.params as z.infer<typeof zParams>;
    const query = req.query as z.infer<typeof zQuery>;
    return res.json({ body, params, query });
  }
}
