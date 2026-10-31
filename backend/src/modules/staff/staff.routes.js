import { Router } from 'express';
import { idParamSchema, staffListQuerySchema, staffMemberSchema } from '@real-estate/shared';
import { authenticate } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.js';

// /api/staff routes (STAFF-SPEC-001). Every route needs an Active developer (STAFF-DEC-006), checked before
// validation, and only ever reaches the caller's own staff (the service filters by employer).
export function createStaffRoutes(controller, { requireActiveDeveloper }) {
  const router = Router();
  router.use(authenticate, requireActiveDeveloper);

  router.get('/', validate({ query: staffListQuerySchema }), controller.list);
  router.post('/', validate({ body: staffMemberSchema }), controller.create);
  router.get('/:id', validate({ params: idParamSchema }), controller.get);
  router.put('/:id', validate({ params: idParamSchema, body: staffMemberSchema }), controller.update);

  return router;
}
