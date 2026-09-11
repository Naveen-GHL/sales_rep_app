import { app } from './app';
import { ENV } from './config/env';

const port = ENV.PORT;

app.listen(port, () => {
  console.log(`================================================`);
  console.log(`🚀 Multi-Tenant Sales API running on port ${port}`);
  console.log(`📡 Environment: ${ENV.NODE_ENV}`);
  console.log(`🔗 Base API URL: http://localhost:${port}/api`);
  console.log(`================================================`);
});
