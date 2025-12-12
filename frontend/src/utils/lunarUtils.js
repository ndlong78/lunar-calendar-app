const TIMEZONE = 7.0; // Vietnam GMT+7
const PI = Math.PI;

const dateCache = new Map();
const monthCache = new Map();

// Cache size limits
const MAX_DATE_CACHE_SIZE = 1000;
const MAX_MONTH_CACHE_SIZE = 100;

const HEAVENLY_STEMS = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
const EARTHLY_BRANCHES = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];

const GOOD_HOURS_BY_DAY_BRANCH = {
  'Tý': ['Dần', 'Mão', 'Thìn', 'Tỵ', 'Thân', 'Dậu'],
  'Ngọ': ['Dần', 'Mão', 'Thìn', 'Tỵ', 'Thân', 'Dậu'],
  'Sửu': ['Tý', 'Dần', 'Mão', 'Ngọ', 'Thân', 'Tuất'],
  'Mùi': ['Tý', 'Dần', 'Mão', 'Ngọ', 'Thân', 'Tuất'],
  'Dần': ['Tý', 'Sửu', 'Thìn', 'Tỵ', 'Mùi', 'Tuất'],
  'Thân': ['Tý', 'Sửu', 'Thìn', 'Tỵ', 'Mùi', 'Tuất'],
  'Mão': ['Tý', 'Dần', 'Mão', 'Ngọ', 'Mùi', 'Dậu'],
  'Dậu': ['Tý', 'Dần', 'Mão', 'Ngọ', 'Mùi', 'Dậu'],
  'Thìn': ['Sửu', 'Dần', 'Thìn', 'Ngọ', 'Thân', 'Dậu'],
  'Tuất': ['Sửu', 'Dần', 'Thìn', 'Ngọ', 'Thân', 'Dậu'],
  'Tỵ': ['Dần', 'Thìn', 'Tỵ', 'Thân', 'Dậu', 'Hợi'],
  'Hợi': ['Dần', 'Thìn', 'Tỵ', 'Thân', 'Dậu', 'Hợi']
};

const HOUR_RANGES = {
  'Tý': { vi: 'Tý (23:00-01:00)', en: 'Rat (11pm-1am)', start: '23:00', end: '01:00' },
  'Sửu': { vi: 'Sửu (01:00-03:00)', en: 'Ox (1am-3am)', start: '01:00', end: '03:00' },
  'Dần': { vi: 'Dần (03:00-05:00)', en: 'Tiger (3am-5am)', start: '03:00', end: '05:00' },
  'Mão': { vi: 'Mão (05:00-07:00)', en: 'Rabbit (5am-7am)', start: '05:00', end: '07:00' },
  'Thìn': { vi: 'Thìn (07:00-09:00)', en: 'Dragon (7am-9am)', start: '07:00', end: '09:00' },
  'Tỵ': { vi: 'Tỵ (09:00-11:00)', en: 'Snake (9am-11am)', start: '09:00', end: '11:00' },
  'Ngọ': { vi: 'Ngọ (11:00-13:00)', en: 'Horse (11am-1pm)', start: '11:00', end: '13:00' },
  'Mùi': { vi: 'Mùi (13:00-15:00)', en: 'Goat (1pm-3pm)', start: '13:00', end: '15:00' },
  'Thân': { vi: 'Thân (15:00-17:00)', en: 'Monkey (3pm-5pm)', start: '15:00', end: '17:00' },
  'Dậu': { vi: 'Dậu (17:00-19:00)', en: 'Rooster (5pm-7pm)', start: '17:00', end: '19:00' },
  'Tuất': { vi: 'Tuất (19:00-21:00)', en: 'Dog (7pm-9pm)', start: '19:00', end: '21:00' },
  'Hợi': { vi: 'Hợi (21:00-23:00)', en: 'Pig (9pm-11pm)', start: '21:00', end: '23:00' }
};

const getLunarMonthName = (month) => {
  const months = {
    1: 'Tháng Một',
    2: 'Tháng Hai',
    3: 'Tháng Ba',
    4: 'Tháng Tư',
    5: 'Tháng Năm',
    6: 'Tháng Sáu',
    7: 'Tháng Bảy',
    8: 'Tháng Tám',
    9: 'Tháng Chín',
    10: 'Tháng Mười',
    11: 'Tháng Mười Một',
    12: 'Tháng Mười Hai'
  };
  return months[month] || '';
};

const getLunarDayName = (day) => {
  const days = {
    1: 'Mùng Một', 2: 'Mùng Hai', 3: 'Mùng Ba', 4: 'Mùng Bốn',
    5: 'Mùng Năm', 6: 'Mùng Sáu', 7: 'Mùng Bảy', 8: 'Mùng Tám',
    9: 'Mùng Chín', 10: 'Mùng Mười', 11: 'Mười Một', 12: 'Mười Hai',
    13: 'Mười Ba', 14: 'Mười Bốn', 15: 'Mười Lăm', 16: 'Mười Sáu',
    17: 'Mười Bảy', 18: 'Mười Tám', 19: 'Mười Chín', 20: 'Hai Mươi',
    21: 'Hai Mươi Mốt', 22: 'Hai Mươi Hai', 23: 'Hai Mươi Ba',
    24: 'Hai Mươi Bốn', 25: 'Hai Mươi Lăm', 26: 'Hai Mươi Sáu',
    27: 'Hai Mươi Bảy', 28: 'Hai Mươi Tám', 29: 'Hai Mươi Chín', 30: 'Ba Mươi'
  };
  return days[day] || '';
};

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

  const stem = HEAVENLY_STEMS[(lunarYear + 6) % 10];
  const branch = EARTHLY_BRANCHES[(lunarYear + 8) % 12];

  return {
    day: lunarDay,
    month: lunarMonth,
    year: lunarYear,
    leap: lunarLeap,
    dayName: getLunarDayName(lunarDay),
    monthName: getLunarMonthName(lunarMonth),
    canChiYear: `${stem} ${branch}`
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
  
  //  CACHE CLEANUP
  if (dateCache.size >= MAX_DATE_CACHE_SIZE) {
    const firstKey = dateCache.keys().next().value;
    dateCache.delete(firstKey);
  }
  
  dateCache.set(key, result);
  return result;
};

export const getDayCanChi = (date) => {
  const jd = jdFromDate(date.getDate(), date.getMonth() + 1, date.getFullYear());
  const stem = HEAVENLY_STEMS[(jd + 9) % 10];
  const branch = EARTHLY_BRANCHES[(jd + 1) % 12];

  return {
    stem,
    branch,
    label: `${stem} ${branch}`
  };
};

export const getAuspiciousHoursForDate = (date, language = 'vi') => {
  const { branch } = getDayCanChi(date);
  const goodBranches = GOOD_HOURS_BY_DAY_BRANCH[branch] || [];

  const formatLabel = (hourBranch) => {
    const info = HOUR_RANGES[hourBranch];
    const label = info ? (language === 'vi' ? info.vi : info.en) : hourBranch;
    return {
      branch: hourBranch,
      label,
      start: info?.start,
      end: info?.end
    };
  };

  const good = goodBranches.map(formatLabel);
  const bad = EARTHLY_BRANCHES
    .filter((hourBranch) => !goodBranches.includes(hourBranch))
    .map(formatLabel);

  return { dayBranch: branch, good, bad };
};

export const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
export const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
export const getLunarKey = (lunar) => `${lunar.month}-${lunar.day}`;

export const formatLunarDateVerbose = (lunar, language = 'vi') => {
  if (!lunar) return '';

  const leapText = lunar.leap ? (language === 'vi' ? ' (nhuận)' : ' (leap)') : '';
  const dayLabel = lunar.dayName ? `${lunar.dayName} (${lunar.day})` : lunar.day;
  const monthLabel = lunar.monthName ? `${lunar.monthName} (${lunar.month})` : lunar.month;
  const yearLabel = lunar.canChiYear ? `${lunar.canChiYear} (${lunar.year})` : lunar.year;

  if (language === 'vi') {
    return `Ngày ${dayLabel} tháng ${monthLabel}${leapText} năm ${yearLabel}`;
  }

  return `Day ${dayLabel}, month ${monthLabel}${leapText}, lunar year ${yearLabel}`;
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
 // ➕ THÊM CACHE CLEANUP
  if (monthCache.size >= MAX_MONTH_CACHE_SIZE) {
    const firstKey = monthCache.keys().next().value;
    monthCache.delete(firstKey);
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
