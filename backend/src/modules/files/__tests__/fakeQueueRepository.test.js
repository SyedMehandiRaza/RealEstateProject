import { createFakeQueueRepository } from '../../../test/fileFakes.js';
import { describeQueueRepositoryContract } from '../../../test/queueRepositoryContract.js';

describeQueueRepositoryContract('in-memory fake', () => createFakeQueueRepository());
