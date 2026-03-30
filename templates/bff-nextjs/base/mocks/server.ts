import { setupServer } from 'msw/node';

// Import handlers from ./handlers/ as features are added
// import { exampleHandlers } from './handlers/example';

export const server = setupServer(
  // ...exampleHandlers,
);
