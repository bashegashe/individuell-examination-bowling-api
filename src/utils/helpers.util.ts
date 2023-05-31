import createHttpError from 'http-errors';
import moment from 'moment';

export function dateObjectFromDateAndTime(date: Date, time: string): Date {
  const dateObj = new Date(date);

  const hours = parseInt(time.split(':')[0]);
  const minutes = parseInt(time.split(':')[1]);

  const timeRegex = /^([01]\d|2[0-3]):?([0-5]\d)$/;

  if (!timeRegex.test(time)) {
    throw createHttpError(400, 'Invalid time format!');
  }

  dateObj.setHours(hours, minutes, 0, 0);

  return dateObj;
}

// Check if a booked date is at minimum one hour after previous booked dates
export function isBookedDateAllowed(bookedDate: Date, currentBookedDates: Date[]): boolean {
  const sortedDates = [...currentBookedDates, bookedDate].sort(
    (a, b) => a.getTime() - b.getTime()
  );

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

export function getStartAndEndOfDayFromDate(date: Date): [Date, Date] {
  const startDate = new Date(date);
  startDate.setUTCHours(0, 0, 0, 0);

  const endDate = new Date(date);
  endDate.setUTCHours(23, 59, 59, 999);

  return [startDate, endDate];
}

export function formatDateAsMomentString(date: Date): string {
  return moment(date).format('YYYY-MM-DD HH:mm');
}
