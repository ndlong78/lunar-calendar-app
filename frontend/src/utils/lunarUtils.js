const TIMEZONE = 7.0; // Vietnam GMT+7
const PI = Math.PI;

const dateCache = new Map();
const monthCache = new Map();

const jdFromDate = (dd, mm, yy) => {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  return dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4)
    - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
};

const jdToDate = (jd) => {
  let a = jd + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return new Date(year, month - 1, day);
};

const NewMoon = (k) => {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = PI / 180;

  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);

  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;

  const C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr)
    + 0.0021 * Math.sin(2 * M * dr)
    - 0.4068 * Math.sin(Mpr * dr)
    + 0.0161 * Math.sin(2 * Mpr * dr)
    - 0.0004 * Math.sin(3 * Mpr * dr)
    + 0.0104 * Math.sin(2 * F * dr)
    - 0.0051 * Math.sin((M + Mpr) * dr)
    + 0.0004 * Math.sin((M - Mpr) * dr)
    + 0.0005 * Math.sin((2 * F + M) * dr)
    + 0.0004 * Math.sin((2 * F - M) * dr)
    - 0.0004 * Math.sin((2 * F - Mpr) * dr)
    + 0.0001 * Math.sin((2 * F + Mpr) * dr)
    + 0.0001 * Math.sin((2 * M + Mpr) * dr)
    + 0.0001 * Math.sin(3 * M * dr);

  const deltat = T < -11
    ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
    : -0.000278 + 0.000265 * T + 0.000262 * T2;

  return Jd1 + C1 - deltat;
};

const getNewMoonDay = (k) => Math.floor(NewMoon(k) + 0.5 + TIMEZONE / 24);

const sunLongitude = (jdn) => {
  const T = (jdn - 2451545.0) / 36525;
  const T2 = T * T;
  const dr = PI / 180;
  const M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL += (0.019993 - 0.000101 * T) * Math.sin(2 * dr * M) + 0.000290 * Math.sin(3 * dr * M);
  let L = L0 + DL;
  L *= dr;
  L = L - Math.PI * 2 * Math.floor(L / (Math.PI * 2));
  return L;
};

const getSunLongitude = (dayNumber) => Math.floor((sunLongitude(dayNumber - 0.5 - TIMEZONE / 24) / Math.PI) * 6);

const getLunarMonth11 = (yy) => {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = Math.floor(off / 29.530588853);
  let nm = getNewMoonDay(k);
  const sunLong = getSunLongitude(nm);
  if (sunLong >= 9) nm = getNewMoonDay(k - 1);
  return nm;
};

const getLeapMonthOffset = (a11) => {
  const k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let last = getSunLongitude(getNewMoonDay(k + 1));
  let i = 2;
  let arc = getSunLongitude(getNewMoonDay(k + i));
  while (arc !== last && i < 15) {
    last = arc;
    i++;
    arc = getSunLongitude(getNewMoonDay(k + i));
  }
  return i - 1;
};

const solarToLunarInternal = (date) => {
  const dd = date.getDate();
  const mm = date.getMonth() + 1;
  const yy = date.getFullYear();

  const dayNumber = jdFromDate(dd, mm, yy);
  let k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1);

  if (monthStart > dayNumber) {
    monthStart = getNewMoonDay(k);
  }

  let a11 = getLunarMonth11(yy);
  let b11 = a11;
  let lunarYear;

  if (a11 >= monthStart) {
    lunarYear = yy;
    a11 = getLunarMonth11(yy - 1);
  } else {
    lunarYear = yy + 1;
    b11 = getLunarMonth11(yy + 1);
  }

  const lunarDay = dayNumber - monthStart + 1;
  let diff = Math.floor((monthStart - a11) / 29);
  let lunarMonth = diff + 11;
  let lunarLeap = false;

  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) lunarLeap = true;
    }
  }

  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;

  return {
    day: lunarDay,
    month: lunarMonth,
    year: lunarYear,
    leap: lunarLeap
  };
};

export const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const solarToLunar = (date) => {
  const key = formatDateKey(date);
  const cached = dateCache.get(key);
  if (cached) return cached;

  const result = solarToLunarInternal(date);
  dateCache.set(key, result);
  return result;
};

export const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
export const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
export const getLunarKey = (lunar) => `${lunar.month}-${lunar.day}`;

export const formatLunarDateVerbose = (lunar, language = 'vi') => {
  if (!lunar) return '';

  const leapText = lunar.leap ? (language === 'vi' ? ' (nhuận)' : ' (leap)') : '';
  const dayLabel = lunar.dayName ? `${lunar.dayName} (${lunar.day})` : lunar.day;
  const monthLabel = lunar.monthName ? `${lunar.monthName} (${lunar.month})` : lunar.month;

  if (language === 'vi') {
    return `Ngày ${dayLabel} tháng ${monthLabel}${leapText} năm ${lunar.year}`;
  }

  return `Day ${dayLabel}, month ${monthLabel}${leapText}, lunar year ${lunar.year}`;
};

export const buildMonthlyLunarMap = (date) => {
  const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
  const cached = monthCache.get(monthKey);
  if (cached) return cached;

  const daysInMonth = getDaysInMonth(date);
  const map = new Map();

  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(date.getFullYear(), date.getMonth(), day);
    const lunar = solarToLunar(currentDate);
    const key = getLunarKey(lunar);
    const entries = map.get(key) || [];
    entries.push({ date: currentDate, lunar });
    map.set(key, entries);
  }

  monthCache.set(monthKey, map);
  return map;
};

export const getZodiacSign = (date, zodiacSigns) => {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dateNum = month * 100 + day;

  for (let sign of zodiacSigns) {
    const [start, end] = sign.dates.split('-').map(x => {
      const [mm, dd] = x.split('/');
      return parseInt(mm, 10) * 100 + parseInt(dd, 10);
    }).sort((a, b) => a - b);

    if (start <= end) {
      if (dateNum >= start && dateNum <= end) return sign;
    } else {
      if (dateNum >= start || dateNum <= end) return sign;
    }
  }

  return zodiacSigns[0];
};

export const lunarDateToSolar = (lunarDay, lunarMonth, lunarYear, lunarLeap = false) => {
  let a11 = getLunarMonth11(lunarYear);
  let b11 = a11;
  if (a11 >= getNewMoonDay(Math.floor((a11 - 2415021.076998695) / 29.530588853))) {
    a11 = getLunarMonth11(lunarYear - 1);
  } else {
    b11 = getLunarMonth11(lunarYear + 1);
  }

  let k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let off = lunarMonth - 11;
  if (off < 0) off += 12;

  if (b11 - a11 > 365) {
    const leapOff = getLeapMonthOffset(a11);
    let leapMonth = leapOff - 2;
    if (leapMonth < 0) leapMonth += 12;
    if (lunarLeap && lunarMonth !== leapMonth) return { error: 'Invalid lunar leap month' };
    if (lunarLeap || off >= leapOff) off += 1;
  }

  const monthStart = getNewMoonDay(k + off);
  return jdToDate(monthStart + lunarDay - 1);
};

export const clearLunarCaches = () => {
  dateCache.clear();
  monthCache.clear();
};
