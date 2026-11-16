import { createServer } from './aggregateServer';

const port = Number(process.env.PORT ?? 3000);
createServer().listen(port, '0.0.0.0', () => {
  console.log(`aggregate server listening on ${port}`);
});
