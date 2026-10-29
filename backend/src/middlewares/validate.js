import { toFieldErrors } from '@real-estate/shared';
import { AppError } from '../utils/AppError.js';

// validate({ body, params, query }) with schemas from @real-estate/shared.
// Parsed values are exposed on req.validated; all field errors are returned together.
export const validate = (schemas) => (req, _res, next) => {
  const validated = {};
  let fields = {};

  for (const [part, schema] of Object.entries(schemas)) {
    const result = schema.safeParse(req[part] ?? {});
    if (result.success) {
      validated[part] = result.data;
    } else {
      fields = { ...fields, ...toFieldErrors(result.error) };
    }
  }

  if (Object.keys(fields).length) {
    return next(new AppError('VALIDATION_ERROR', { fields }));
  }
  req.validated = validated;
  next();
};
