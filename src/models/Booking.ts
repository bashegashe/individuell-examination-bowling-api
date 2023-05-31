import { Schema, model, type Types, type HydratedDocument } from 'mongoose';
import createHttpError from 'http-errors';
import { Lane } from './Lane';

export interface IBooking {
  date: Date;
  email: string;
  numberOfPlayers: number;
  numberOfLanes: number;
  shoeSizes: number[];
  totalPrice?: number;
  lanes?: Types.ObjectId[];
}

export type BookingDocument = HydratedDocument<IBooking>;

const bookingSchema = new Schema<IBooking>({
  date: {
    type: Date,
    required: true,
    validate: [
      {
        validator: (date: Date): boolean => {
          return new Date() < date;
        },
        message: 'You can only book for future dates!'
      },
      {
        validator: (date: Date): boolean => {
          const openTime = new Date(date);
          openTime.setHours(11, 0, 0, 0);

          const lastBookTime = new Date(date);
          lastBookTime.setHours(21, 0, 0, 0);

          return date >= openTime && date <= lastBookTime;
        },
        message: 'The bowling alley is only open between 11.00-22.00! Book at earliest 11.00 and at latest 21.00!'
      }
    ]
  },
  email: {
    type: String,
    required: true,
    validate: {
      validator: (email: string): boolean => {
        const emailRegex = /^\S+@\S+\.\S+$/;

        return emailRegex.test(email);
      },
      message: 'Invalid email format!'
    }
  },
  numberOfPlayers: {
    type: Number,
    required: true
  },
  numberOfLanes: {
    type: Number,
    required: true,
    min: [1, "You can't book less than 1 lane!"],
    max: [8, "You can't book more than 8 lanes!"]
  },
  shoeSizes: {
    type: [Number],
    required: true
  },
  totalPrice: {
    type: Number
  },
  lanes: [{
    type: Schema.Types.ObjectId,
    ref: 'Lane',
    required: true
  }]
});

bookingSchema.pre('save', async function() {
  const booking = this as IBooking;

  if (booking.shoeSizes.length !== booking.numberOfPlayers) {
    throw createHttpError(400, 'Number of shoe sizes must match number of players!');
  }

  booking.totalPrice = booking.numberOfPlayers * 120 + booking.numberOfLanes * 100;

  if (!this.isModified()) {
    throw createHttpError(400, 'No changes were made!');
  }

  if (this.isModified('date') || this.isModified('numberOfLanes') || this.isNew) {
    await Lane.addLanesToBooking(this);
  }
});

export const Booking = model<IBooking>('Booking', bookingSchema);
