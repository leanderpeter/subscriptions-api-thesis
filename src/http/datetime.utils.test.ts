import {
  calculateDaysBetweenDates,
  calculateEndDate,
  parseDate,
} from "~/src/http/datetime.utils";
import { InvalidInputError } from "~/src/domain/types/errors";

describe("parseDate", () => {
  test("Receives ISO_DATE (with Berlin zone) - should return formatted JSDate", () => {
    const dateString = "2022-07-21";
    const jsDate = parseDate(dateString);
    expect(jsDate.toISOString()).toBe("2022-07-20T22:00:00.000Z");
  });

  test("Wrong ISO date format - should return InvalidInputError", () => {
    expect(() => {
      parseDate("thursday 03. october 2021");
    }).toThrow(InvalidInputError);
  });

  test("No date string - should return InvalidInputError", () => {
    expect(() => {
      parseDate("");
    }).toThrow(InvalidInputError);
  });
});

describe("calculateEndDate", () => {
  test("success - should return jsDate + term", () => {
    const d = new Date("2022-11-16T10:35:03+0100");
    const jsDate = calculateEndDate(d, 6);
    expect(jsDate).toStrictEqual(new Date("2023-05-16T08:35:03.000Z"));
  });

  test("success - should return jsDate + term as decimal", () => {
    const d = new Date("2022-11-16T10:35:03+0100");
    const jsDate = calculateEndDate(d, 6.5);
    expect(jsDate).toStrictEqual(new Date("2023-05-31T08:35:03.000Z"));
  });

  test("success - should return jsDate + negativ term", () => {
    const d = new Date("2022-11-16T10:35:03+0100");
    const jsDate = calculateEndDate(d, -6);
    expect(jsDate).toStrictEqual(new Date("2022-05-16T08:35:03.000Z"));
  });
});

describe("calculateDaysBetweenDates", () => {
  test("success - should return 1 (without time)", () => {
    const firstDate = new Date("10-10-2022");
    const secondDate = new Date("10-11-2022");
    const diff = calculateDaysBetweenDates(firstDate, secondDate);
    expect(diff).toBe(1);
  });

  test("success - should return 0 (without time)", () => {
    const firstDate = new Date("10-10-2022");
    const secondDate = new Date("10-10-2022");
    const diff = calculateDaysBetweenDates(firstDate, secondDate);
    expect(diff).toBe(0);
  });

  test("success - should return smaller than 1 (with time)", () => {
    const firstDate = new Date("2022-11-10T09:59:10+0100");
    const secondDate = new Date("2022-11-10T23:59:10+0100");
    const diff = calculateDaysBetweenDates(firstDate, secondDate);
    expect(diff < 1).toBe(true);
  });

  test("success flipped - should return smaller than 1 (with time)", () => {
    const firstDate = new Date("2022-11-10T23:59:10+0100");
    const secondDate = new Date("2022-11-10T09:59:10+0100");
    const diff = calculateDaysBetweenDates(firstDate, secondDate);
    expect(diff < 1).toBe(true);
  });

  test("success - should return 0 (with time)", () => {
    const firstDate = new Date("2022-11-10T09:59:10+0100");
    const secondDate = new Date("2022-11-10T09:59:10+0100");
    const diff = calculateDaysBetweenDates(firstDate, secondDate);
    expect(diff).toBe(0);
  });
});
