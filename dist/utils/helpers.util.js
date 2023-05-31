"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatDateAsMomentString = exports.getStartAndEndOfDayFromDate = exports.isBookedDateAllowed = exports.dateObjectFromDateAndTime = void 0;
const http_errors_1 = __importDefault(require("http-errors"));
const moment_1 = __importDefault(require("moment"));
function dateObjectFromDateAndTime(date, time) {
    const dateObj = new Date(date);
    const hours = parseInt(time.split(':')[0]);
    const minutes = parseInt(time.split(':')[1]);
    const timeRegex = /^([01]\d|2[0-3]):?([0-5]\d)$/;
    if (!timeRegex.test(time)) {
        throw (0, http_errors_1.default)(400, 'Invalid time format!');
    }
    dateObj.setHours(hours, minutes, 0, 0);
    return dateObj;
}
exports.dateObjectFromDateAndTime = dateObjectFromDateAndTime;
// Check if a booked date is at minimum one hour after previous booked dates
function isBookedDateAllowed(bookedDate, currentBookedDates) {
    const sortedDates = [...currentBookedDates, bookedDate].sort((a, b) => a.getTime() - b.getTime());
    const oneHour = 60 * 60 * 1000;
    for (let i = 0; i < sortedDates.length - 1; i++) {
        const currentDateTime = sortedDates[i].getTime();
        const nextDateTime = sortedDates[i + 1].getTime();
        if (nextDateTime - currentDateTime < oneHour) {
            return false;
        }
    }
    return true;
}
exports.isBookedDateAllowed = isBookedDateAllowed;
function getStartAndEndOfDayFromDate(date) {
    const startDate = new Date(date);
    startDate.setUTCHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setUTCHours(23, 59, 59, 999);
    return [startDate, endDate];
}
exports.getStartAndEndOfDayFromDate = getStartAndEndOfDayFromDate;
function formatDateAsMomentString(date) {
    return (0, moment_1.default)(date).format('YYYY-MM-DD HH:mm');
}
exports.formatDateAsMomentString = formatDateAsMomentString;
