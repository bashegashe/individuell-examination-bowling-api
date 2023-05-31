import { Schema, type Model, model, type Types, type HydratedDocument } from 'mongoose';
import { type BookingDocument, Booking, type IBooking } from './Booking';
import { isBookedDateAllowed, getStartAndEndOfDayFromDate, formatDateAsMomentString } from '../utils/helpers.util';

interface ILane {
  laneNumber: number;
}

interface TLane { _id: Types.ObjectId, bookedDates: Date[], laneNumber: number }

interface LaneModel extends Model<ILane> {
  addLanesIfNotExists: () => Promise<void>;
  addLanesToBooking: (booking: BookingDocument) => Promise<void>;
  getBookedLanesByDate: (startDate: Date, endDate: Date | undefined, ignoreBookingWithId?: Types.ObjectId | undefined) => Promise<TLane[]>;
  getAvailableLanesByDate: (bookedDate: Date | undefined, ignoreBookingWithId?: Types.ObjectId | undefined) => Promise<Array<HydratedDocument<ILane>>>;
}

const laneSchema = new Schema<ILane, LaneModel>({
  laneNumber: {
    type: Number,
    required: true
  }
});

// Exposed to API and used for finding booked lanes by date
laneSchema.statics.getBookedLanesByDate = async function (
  startDate: Date, endDate?: Date, ignoreBookingWithId: Types.ObjectId | undefined = undefined
): ReturnType<LaneModel['getBookedLanesByDate']> {
  const dateMatch = {
    date: {
      $gte: startDate,
      ...(endDate && { $lte: endDate })
    },
    ...(ignoreBookingWithId && { _id: { $ne: ignoreBookingWithId } })
  };

  const lanes: TLane[] = await Booking.aggregate([
    { $match: dateMatch },
    { $unwind: '$lanes' },
    { $group: { _id: '$lanes', bookedDates: { $push: '$date' } } },
    { $lookup: { from: 'lanes', localField: '_id', foreignField: '_id', as: 'lane' } },
    { $unwind: '$lane' },
    { $project: { _id: 1, bookedDates: { $setUnion: '$bookedDates' }, laneNumber: '$lane.laneNumber' } },
    { $sort: { laneNumber: 1 } }
  ]);

  return lanes;
};

// Used internally for finding available lanes by date
laneSchema.statics.getAvailableLanesByDate = async function (
  bookedDate: Date, ignoreBookingWithId: Types.ObjectId | undefined = undefined
): ReturnType<LaneModel['getAvailableLanesByDate']> {
  const [startDate, endDate] = getStartAndEndOfDayFromDate(bookedDate);

  const allLanes = await this.find();

  const bookedLanes = await this.getBookedLanesByDate(startDate, endDate, ignoreBookingWithId);

  const availableLanes = allLanes.filter(lane => {
    const bookedDates = bookedLanes.find(laneDates => laneDates._id.equals(lane._id))?.bookedDates ?? [];

    return isBookedDateAllowed(bookedDate, bookedDates);
  });

  return availableLanes;
};

// Currently handles both adding lanes to a new booking and updating lanes for an existing booking
laneSchema.statics.addLanesToBooking = async function (booking: BookingDocument): Promise<void> {
  // The two variables below exist for increased type safety
  const date: keyof IBooking = 'date';
  const numberOfLanes: keyof IBooking = 'numberOfLanes';

  const bookedDate = booking.date;

  let availableLanes;

  // To allow scaling up the number of lanes correctly for the same booking. Pass in extra arg to getAvailableLanesByDate() to ignore the current booking.
  if (booking.isModified(numberOfLanes)) {
    availableLanes = await this.getAvailableLanesByDate(bookedDate, booking._id);
  } else {
    availableLanes = await this.getAvailableLanesByDate(bookedDate);
  }

  if (availableLanes.length === 0) {
    throw new Error(`No available lanes at ${formatDateAsMomentString(bookedDate)}!`);
  } else if (availableLanes.length < booking.numberOfLanes) {
    throw new Error(`Not enough available lanes at ${formatDateAsMomentString(bookedDate)}!`);
  }

  if (booking.isModified(date) || booking.isModified(numberOfLanes)) {
    booking.lanes = [];
  }

  for (let i = 0; i < booking.numberOfLanes; i++) {
    const lane = availableLanes[i];

    booking.lanes?.push(lane._id);

    await lane.save();
  }
};

laneSchema.statics.addLanesIfNotExists = async function (): Promise<void> {
  const lanes = await this.find();

  if (lanes.length > 0) {
    return;
  }

  const lanesArray = [...Array(8)].map((_, i) => ({ laneNumber: i + 1 }));

  await Lane.insertMany(lanesArray);
};

export const Lane = model<ILane, LaneModel>('Lane', laneSchema);
