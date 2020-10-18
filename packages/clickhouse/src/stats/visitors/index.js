const { getDateRange } = require("../fragments");

const ONE_DAY = 1000 * 60 * 60 * 24;
const ONE_MONTH = ONE_DAY * 31;
const ONE_YEAR = ONE_MONTH * 12;
const MONTHS = {
  1: "January",
  2: "February",
  3: "March",
  4: "April",
  5: "May",
  6: "June",
  7: "July",
  8: "August",
  9: "September",
  10: "October",
  11: "November",
  12: "December",
};

/**
 * Each `dateRange.to` value represents 23:59:59 on a given day.
 * The `+ 1` in the calculations below are there to represent a full day.
 *
 * Note: Use a `format` that can be used in an `ORDER BY` query to naturally
 * sort the results, e.g. "2020 08". Use `getLabel` to turn that into a label
 * that is displayed in the UI.
 */
const dateRangeOptions = [
  {
    test: ({ from, to }) => to - from + 1 === ONE_DAY,
    format: "%H",
    getLabel: (valueString) => {
      const value = valueString * 1;
      return value < 12
        ? `${value === 0 ? 12 : value}am`
        : `${value === 12 ? 12 : value - 12}pm`;
    },
  },
  {
    test: ({ from, to }) =>
      to - from + 1 > ONE_DAY && to - from + 1 <= ONE_MONTH,
    format: "%F",
    getLabel: (value) => value,
  },
  {
    test: ({ from, to }) =>
      to - from + 1 > ONE_MONTH && to - from + 1 <= ONE_YEAR,
    format: "%Y %m",
    getLabel: (value) =>
      `${MONTHS[value.substring(5) * 1]} ${value.substring(0, 4)}`, // `* 1` to convert "01" to 1
  },
  {
    test: ({ from, to }) => to - from + 1 > ONE_YEAR,
    format: "%Y",
    getLabel: (value) => value,
  },
  {
    test: () => true,
    format: "%F",
    getLabel: (value) => value,
  },
];

const fetchVisitors = (ch) => async (dateRange, domain, websiteSettings) => {
  const { chDbName, timezone } = websiteSettings;
  const { format, getLabel } = dateRangeOptions.find((dateRangeOption) =>
    dateRangeOption.test({
      from: dateRange.from.getTime(),
      to: dateRange.to.getTime(),
    })
  );
  const sql = `SELECT formatDateTime(timestamp, '${format}', '${timezone}') AS daterange, COUNT(DISTINCT user_id) AS total FROM ${chDbName}.events WHERE ${getDateRange(
    dateRange,
    timezone
  )} AND domain = '${domain}' GROUP BY daterange ORDER BY daterange`;

  const stream = ch.query(sql);

  return new Promise((resolve, reject) => {
    const result = {};
    stream.on("error", (error) => reject(error));

    stream.on("data", (row) => {
      // row: [label, total]
      result[getLabel(row[0])] = row[1] * 1;
    });

    stream.on("end", () => {
      resolve(result);
    });
  });
};

module.exports = {
  fetchVisitors,
};
