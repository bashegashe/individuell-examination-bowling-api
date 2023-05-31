import { Router } from 'express';
import { type IBooking, Booking } from '../models/Booking';
import createHttpError from 'http-errors';
import { controller } from '../utils/controller.util';
import { dateObjectFromDateAndTime, formatDateAsMomentString } from '../utils/helpers.util';
import { Lane } from '../models/Lane';

const router = Router();

// Make a new reservation
router.post('/', controller(async (req, res): Promise<void> => {
  const { date, email, numberOfPlayers, numberOfLanes, shoeSizes }: IBooking = req.body;
  const time: string = req.body.time;

  try {
    const booking = new Booking<IBooking>({
      date: dateObjectFromDateAndTime(date, time),
      email,
      numberOfPlayers,
      numberOfLanes,
      shoeSizes
    });

    await booking.save();

    res.json({ status: 'success', message: 'Booking saved successfully!', bookingId: booking._id });
  } catch (err) {
    if (err instanceof Error) {
      throw createHttpError(400, err.message);
    }

    throw createHttpError(500, 'Could not save booking!');
  }
}));

// Get reservations between two dates
router.get('/', controller(async (req, res): Promise<void> => {
  const { start, end } = req.query;

  if (!start) {
    throw createHttpError(400, 'Start date is required!');
  }

  const startDate = new Date(start as string);
  startDate.setUTCHours(0, 0, 0, 0);

  let endDate: Date | undefined;

  if (end !== undefined) {
    endDate = new Date(end as string);
    endDate.setUTCHours(23, 59, 59, 999);

    if (startDate > endDate) {
      throw createHttpError(400, 'Start date must be before or the same day as end date!');
    }
  }

  const bookedLanes = await Lane.getBookedLanesByDate(startDate, endDate);

  bookedLanes.forEach((lane) => {
    lane.bookedDates = lane.bookedDates.map((date) => formatDateAsMomentString(date)) as unknown as Date[];
  });

  res.json(bookedLanes);
}));

// Update a reservation
router.patch('/:id', controller(async (req, res): Promise<void> => {
  const allowedUpdateProperties = ['date', 'time', 'email', 'numberOfPlayers', 'numberOfLanes', 'shoeSizes'];

  const updateProperties = Object.keys(req.body);

  const booking: IBooking & Record<string, any> | null = await Booking.findById(req.params.id);

  if (!booking) {
    throw createHttpError(404, 'Booking not found!');
  }

  const isValid = updateProperties.every((property) => allowedUpdateProperties.includes(property));

  if (!isValid) {
    throw createHttpError(400, 'Invalid update properties!');
  }

  updateProperties.forEach((property) => {
    if (property === 'date') {
      if (req.body.time === undefined) {
        throw createHttpError(400, 'Time is required when updating date!');
      }

      booking.date = dateObjectFromDateAndTime(req.body.date, req.body.time);
    } else {
      booking[property] = req.body[property];
    }
  });

  try {
    await booking.save();

    res.json({ status: 'success', message: 'Booking updated successfully!' });
  } catch (err) {
    if (err instanceof Error) {
      throw createHttpError(400, err.message);
    }

    throw createHttpError(500, 'Could not update booking!');
  }
}));

// Delete a reservation
router.delete('/:id', controller(async (req, res): Promise<void> => {
  const booking = await Booking.findByIdAndDelete(req.params.id);

  if (!booking) {
    throw createHttpError(404, 'Booking not found!');
  }

  res.json({ status: 'success', message: 'Booking deleted successfully!' });
}));

// Get reservation status
router.get('/:id', controller(async (req, res): Promise<void> => {
  const booking = await Booking.findById(req.params.id, '-__v').lean();

  if (!booking) {
    throw createHttpError(404, 'Booking not found!');
  }

  const localDate = formatDateAsMomentString(booking.date);

  res.json({ ...booking, date: localDate });
}));

// Remove all bookings (DEV)
router.delete('/', controller(async (req, res): Promise<void> => {
  await Booking.deleteMany({});

  res.json({ status: 'success', message: 'Bookings deleted successfully!' });
}));

export { router as bookingsRouter };
