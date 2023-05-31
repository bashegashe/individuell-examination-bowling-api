import 'dotenv/config';
import './utils/db.util';

import express from 'express';

import routes from './routes';
import { errorHandler, notFoundHandler, logErrors } from './middleware/errors.middleware';

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());

app.use('/api', routes);

app.use(notFoundHandler);
app.use(logErrors);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}!`);
});
