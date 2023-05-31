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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingsRouter = void 0;
const express_1 = require("express");
const Booking_1 = require("../models/Booking");
const http_errors_1 = __importDefault(require("http-errors"));
const controller_util_1 = require("../utils/controller.util");
const helpers_util_1 = require("../utils/helpers.util");
const Lane_1 = require("../models/Lane");
const router = (0, express_1.Router)();
exports.bookingsRouter = router;
// Make a new reservation
router.post('/', (0, controller_util_1.controller)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { date, email, numberOfPlayers, numberOfLanes, shoeSizes } = req.body;
    const time = req.body.time;
    try {
        const booking = new Booking_1.Booking({
            date: (0, helpers_util_1.dateObjectFromDateAndTime)(date, time),
            email,
            numberOfPlayers,
            numberOfLanes,
            shoeSizes
        });
        yield booking.save();
        res.json({ status: 'success', message: 'Booking saved successfully!', bookingId: booking._id });
    }
    catch (err) {
        if (err instanceof Error) {
            throw (0, http_errors_1.default)(400, err.message);
        }
        throw (0, http_errors_1.default)(500, 'Could not save booking!');
    }
})));
// Get reservations between two dates
router.get('/', (0, controller_util_1.controller)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { start, end } = req.query;
    if (!start) {
        throw (0, http_errors_1.default)(400, 'Start date is required!');
    }
    const startDate = new Date(start);
    startDate.setUTCHours(0, 0, 0, 0);
    let endDate;
    if (end !== undefined) {
        endDate = new Date(end);
        endDate.setUTCHours(23, 59, 59, 999);
        if (startDate > endDate) {
            throw (0, http_errors_1.default)(400, 'Start date must be before or the same day as end date!');
        }
    }
    const bookedLanes = yield Lane_1.Lane.getBookedLanesByDate(startDate, endDate);
    bookedLanes.forEach((lane) => {
        lane.bookedDates = lane.bookedDates.map((date) => (0, helpers_util_1.formatDateAsMomentString)(date));
    });
    res.json(bookedLanes);
})));
// Update a reservation
router.patch('/:id', (0, controller_util_1.controller)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const allowedUpdateProperties = ['date', 'time', 'email', 'numberOfPlayers', 'numberOfLanes', 'shoeSizes'];
    const updateProperties = Object.keys(req.body);
    const booking = yield Booking_1.Booking.findById(req.params.id);
    if (!booking) {
        throw (0, http_errors_1.default)(404, 'Booking not found!');
    }
    const isValid = updateProperties.every((property) => allowedUpdateProperties.includes(property));
    if (!isValid) {
        throw (0, http_errors_1.default)(400, 'Invalid update properties!');
    }
    updateProperties.forEach((property) => {
        if (property === 'date') {
            if (req.body.time === undefined) {
                throw (0, http_errors_1.default)(400, 'Time is required when updating date!');
            }
            booking.date = (0, helpers_util_1.dateObjectFromDateAndTime)(req.body.date, req.body.time);
        }
        else {
            booking[property] = req.body[property];
        }
    });
    try {
        yield booking.save();
        res.json({ status: 'success', message: 'Booking updated successfully!' });
    }
    catch (err) {
        if (err instanceof Error) {
            throw (0, http_errors_1.default)(400, err.message);
        }
        throw (0, http_errors_1.default)(500, 'Could not update booking!');
    }
})));
// Delete a reservation
router.delete('/:id', (0, controller_util_1.controller)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const booking = yield Booking_1.Booking.findByIdAndDelete(req.params.id);
    if (!booking) {
        throw (0, http_errors_1.default)(404, 'Booking not found!');
    }
    res.json({ status: 'success', message: 'Booking deleted successfully!' });
})));
// Get reservation status
router.get('/:id', (0, controller_util_1.controller)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const booking = yield Booking_1.Booking.findById(req.params.id, '-__v').lean();
    if (!booking) {
        throw (0, http_errors_1.default)(404, 'Booking not found!');
    }
    const localDate = (0, helpers_util_1.formatDateAsMomentString)(booking.date);
    res.json(Object.assign(Object.assign({}, booking), { date: localDate }));
})));
// Remove all bookings (DEV)
router.delete('/', (0, controller_util_1.controller)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    yield Booking_1.Booking.deleteMany({});
    res.json({ status: 'success', message: 'Bookings deleted successfully!' });
})));
