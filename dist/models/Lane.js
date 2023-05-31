"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lane = void 0;
const mongoose_1 = require("mongoose");
const Booking_1 = require("./Booking");
const helpers_util_1 = require("../utils/helpers.util");
const laneSchema = new mongoose_1.Schema({
    laneNumber: {
        type: Number,
        required: true
    }
});
// Exposed to API and used for finding booked lanes by date
laneSchema.statics.getBookedLanesByDate = function (startDate, endDate, ignoreBookingWithId = undefined) {
    return __awaiter(this, void 0, void 0, function* () {
        const dateMatch = Object.assign({ date: Object.assign({ $gte: startDate }, (endDate && { $lte: endDate })) }, (ignoreBookingWithId && { _id: { $ne: ignoreBookingWithId } }));
        const lanes = yield Booking_1.Booking.aggregate([
            { $match: dateMatch },
            { $unwind: '$lanes' },
            { $group: { _id: '$lanes', bookedDates: { $push: '$date' } } },
            { $lookup: { from: 'lanes', localField: '_id', foreignField: '_id', as: 'lane' } },
            { $unwind: '$lane' },
            { $project: { _id: 1, bookedDates: { $setUnion: '$bookedDates' }, laneNumber: '$lane.laneNumber' } },
            { $sort: { laneNumber: 1 } }
        ]);
        return lanes;
    });
};
// Used internally for finding available lanes by date
laneSchema.statics.getAvailableLanesByDate = function (bookedDate, ignoreBookingWithId = undefined) {
    return __awaiter(this, void 0, void 0, function* () {
        const [startDate, endDate] = (0, helpers_util_1.getStartAndEndOfDayFromDate)(bookedDate);
        const allLanes = yield this.find();
        const bookedLanes = yield this.getBookedLanesByDate(startDate, endDate, ignoreBookingWithId);
        const availableLanes = allLanes.filter(lane => {
            var _a, _b;
            const bookedDates = (_b = (_a = bookedLanes.find(laneDates => laneDates._id.equals(lane._id))) === null || _a === void 0 ? void 0 : _a.bookedDates) !== null && _b !== void 0 ? _b : [];
            return (0, helpers_util_1.isBookedDateAllowed)(bookedDate, bookedDates);
        });
        return availableLanes;
    });
};
// Currently handles both adding lanes to a new booking and updating lanes for an existing booking
laneSchema.statics.addLanesToBooking = function (booking) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        // The two variables below exist for increased type safety
        const date = 'date';
        const numberOfLanes = 'numberOfLanes';
        const bookedDate = booking.date;
        let availableLanes;
        // To allow scaling up the number of lanes correctly for the same booking. Pass in extra arg to getAvailableLanesByDate() to ignore the current booking.
        if (booking.isModified(numberOfLanes)) {
            availableLanes = yield this.getAvailableLanesByDate(bookedDate, booking._id);
        }
        else {
            availableLanes = yield this.getAvailableLanesByDate(bookedDate);
        }
        if (availableLanes.length === 0) {
            throw new Error(`No available lanes at ${(0, helpers_util_1.formatDateAsMomentString)(bookedDate)}!`);
        }
        else if (availableLanes.length < booking.numberOfLanes) {
            throw new Error(`Not enough available lanes at ${(0, helpers_util_1.formatDateAsMomentString)(bookedDate)}!`);
        }
        if (booking.isModified(date) || booking.isModified(numberOfLanes)) {
            booking.lanes = [];
        }
        for (let i = 0; i < booking.numberOfLanes; i++) {
            const lane = availableLanes[i];
            (_a = booking.lanes) === null || _a === void 0 ? void 0 : _a.push(lane._id);
            yield lane.save();
        }
    });
};
laneSchema.statics.addLanesIfNotExists = function () {
    return __awaiter(this, void 0, void 0, function* () {
        const lanes = yield this.find();
        if (lanes.length > 0) {
            return;
        }
        const lanesArray = [...Array(8)].map((_, i) => ({ laneNumber: i + 1 }));
        yield exports.Lane.insertMany(lanesArray);
    });
};
exports.Lane = (0, mongoose_1.model)('Lane', laneSchema);
