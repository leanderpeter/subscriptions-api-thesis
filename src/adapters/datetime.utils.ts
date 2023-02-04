import { DateTime } from "luxon";
import { DATE_FORMATS, ZONES } from "~/src/domain/types/datetime";
import { InvalidInputError } from "~/src/domain/types/errors";

export function parseDate(
  datetime: string,
  inputFormat: DATE_FORMATS = DATE_FORMATS.ISO_DATE,
  zone: ZONES = ZONES.EUROPE_BERLIN
): Date {
  const d = DateTime.fromFormat(datetime, inputFormat, {
    zone: zone,
  });
  if (!d.isValid) {
    throw new InvalidInputError("Date", `${String(d.invalidExplanation)}`);
  }
  return d.toJSDate();
}

export function calculateEndDate(date: Date, termInMonths: number): Date {
  let d = DateTime.fromJSDate(date, { zone: ZONES.EUROPE_BERLIN });
  d = d.plus({
    months: termInMonths,
  });
  return d.toJSDate();
}

export function calculateDaysBetweenDates(
  startDate: Date,
  endDate: Date
): number {
  const secondDate = DateTime.fromJSDate(endDate);
  const firstDate = DateTime.fromJSDate(startDate);

  const diff = secondDate.diff(firstDate, "days");
  return diff.days;
}
