// Campus runs on Indian Standard Time. The server (Render, etc.) usually runs
// in UTC, so every "what time is it on campus" decision goes through here.
const TZ = process.env.CAMPUS_TIMEZONE || "Asia/Kolkata";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export const getCampusNow = (date = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .formatToParts(date)
    .reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {});

  const hour = parts.hour === "24" ? "00" : parts.hour;
  return {
    day: parts.weekday, // "Monday"
    time: `${hour}:${parts.minute}`, // "09:30"
    dateKey: `${parts.year}-${parts.month}-${parts.day}`, // "2026-10-06"
  };
};

// Midnight (campus time) of the given date as a UTC Date, used as lectureDate.
export const campusMidnight = (date = new Date()) => {
  const { dateKey } = getCampusNow(date);
  return new Date(`${dateKey}T00:00:00+05:30`);
};

export { DAY_NAMES };
