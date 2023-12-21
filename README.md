# Zod Express validator
This package provides a set of usefull [Express](https://www.npmjs.com/package/express) tools for REST request validation with [zod](https://www.npmjs.com/package/zod) (body, parameters and query) based on [Matt Pocock's](https://https://www.mattpocock.com/) (💜) solution.

### Installation
```bash
npm i @bebrasmell/zod-express
 ```

### Validating body
Define your request body schema:
``` typescript
import { z } from 'zod';

const zBody = z.object({
  // ... your zod schema
});
```

Create an endpoint using ```CheckBody``` function:
``` typescript
const my_endpoint = CheckBody(zBody, (req, res) => {
  const body = req.body;
  // ... the rest of your code
});
```

You can also parse your request parameters using ```CheckParams```:
``` typescript
const my_endpoint = CheckParams(zParams, (req, res) => {
  const params = req.params;
  // ... the rest of your code
});
```

And query parameters using ```CheckQuery```:
``` typescript
const my_endpoint = CheckQuery(zQuery, (req, res) => {
  const query = req.query;
  // ... the rest of your code
});
```

As you can see, req.body, req.params and req.query are inferring types from your zod schema.

> Please remember that ```Express``` params and query parameters are always strings. If you want to parse them to other types, you have to do it manually.

But what if... We want to validate all of them at once? No problem, just use ```Check```:
``` typescript
const my_endpoint = Check({
  body: zBody,
  params: zParams,
  query: zQuery
}, (req, res) => {
  const body = req.body;
  const params = req.params;
  const query = req.query;
  // ... the rest of your code
});
```

### Error handling
If validation fails, ```Check```, ```CheckBody```, ```CheckParams``` and ```CheckQuery``` will automatically send ```406``` response with error message. If you want to handle errors yourself, you can use ```ValidationOptions```:

``` typescript
const my_error_handler: ze.ValidationOptions = {
  errorCode: 400, // default is 406 (Not Acceptable)
  errorHandler: (req, res, error) => { // error is zod Error
    const error_message = error.errors[0].message;
    // ... your error handling code
  }
};

const my_endpoint = Check({
  body: zBody,
  params: zParams,
  query: zQuery
}, (req, res) => {
  const body = req.body;
  const params = req.params;
  const query = req.query;
  // ... the rest of your code
}, my_error_handler);
```

```ValidationOptions``` interface:
``` typescript
type ErrorHandler = (req: Request, res: Response, error: z.ZodError) => void;

interface ValidationOptions {
  errorCode?: number;
  errorHandler?: ErrorHandler;
}
```

### Experimental: decorators
You can also use decorators to validate your requests. Just add ```@ValidateBody```, ```@ValidateParams```, ```@ValidateQuery``` or ```@Validate``` to your endpoint function:
``` typescript
export class Example {

  @ValidateBody(zBody)
  public static my_endpoint(req: Request, res: Response) {
    const body = req.body as z.infer<typeof zBody>;
    // ... the rest of your code
  }
  
}
```
> Due to the limitations of TypeScript decorators, you have to specify the type of req.body manually.
