import { jest } from '@jest/globals';
import { staffMessages } from '@real-estate/shared';
import { ForeignKeyConstraintError } from 'sequelize';
import { createStaffService } from '../staff.service.js';

// Service rules that cannot be reached reliably through HTTP (STAFF-020 code review): a property deleted
// between the ownership check and the assignment insert.
const sequelize = { transaction: (work) => work({ LOCK: { UPDATE: 'UPDATE' } }) };

describe('staff service: assignProperty', () => {
  it('answers 404 propertyNotFound when the property disappears before the insert (FK race)', async () => {
    const repository = {
      lockMember: jest.fn().mockResolvedValue({ id: 3 }),
      findOwnProperty: jest.fn().mockResolvedValue({ id: 9 }),
      assignProperty: jest.fn().mockRejectedValue(new ForeignKeyConstraintError({ message: 'fk' })),
    };
    const service = createStaffService({ sequelize, repository });

    await expect(service.assignProperty(1, 3, { propertyId: 9 })).rejects.toMatchObject({
      code: 'NOT_FOUND',
      message: staffMessages.api.propertyNotFound,
    });
  });
});
