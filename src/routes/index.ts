import { Router } from 'express';

import { bookingsRouter } from './bookings.route';

const routes = Router();

routes.use('/bookings', bookingsRouter);

export default routes;
