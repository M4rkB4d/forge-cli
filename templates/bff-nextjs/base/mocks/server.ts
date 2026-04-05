import { setupServer } from 'msw/node';
import { sampleHandlers } from './handlers/sample-handlers';

export const server = setupServer(
  ...sampleHandlers,
);
