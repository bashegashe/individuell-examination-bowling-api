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
exports.Booking = void 0;
const mongoose_1 = require("mongoose");
const http_errors_1 = __importDefault(require("http-errors"));
const Lane_1 = require("./Lane");
const bookingSchema = new mongoose_1.Schema({
    date: {
        type: Date,
        required: true,
        validate: [
            {
                validator: (date) => {
                    return new Date() < date;
                },
                message: 'You can only book for future dates!'
            },
            {
                validator: (date) => {
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
            validator: (email) => {
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
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Lane',
            required: true
        }]
});
bookingSchema.pre('save', function () {
    return __awaiter(this, void 0, void 0, function* () {
        const booking = this;
        if (booking.shoeSizes.length !== booking.numberOfPlayers) {
            throw (0, http_errors_1.default)(400, 'Number of shoe sizes must match number of players!');
        }
        booking.totalPrice = booking.numberOfPlayers * 120 + booking.numberOfLanes * 100;
        if (!this.isModified()) {
            throw (0, http_errors_1.default)(400, 'No changes were made!');
        }
        if (this.isModified('date') || this.isModified('numberOfLanes') || this.isNew) {
            yield Lane_1.Lane.addLanesToBooking(this);
        }
    });
});
exports.Booking = (0, mongoose_1.model)('Booking', bookingSchema);
