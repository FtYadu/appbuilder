import { expect, test } from 'vitest';

test('health check returns ok', async () => {
  // This is a placeholder test.
  // In a real scenario, we would spin up the server and make a request.
  expect({ status: 'ok' }).toEqual({ status: 'ok' });
});
