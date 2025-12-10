class LunarCalendar {
  static TIMEZONE = 7.0; // Vietnam GMT+7

  static jdFromDate(dd, mm, yy) {
    const a = Math.floor((14 - mm) / 12);
    const y = yy + 4800 - a;
    const m = mm + 12 * a - 3;
    return dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) -
      Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  }

  static jdToDate(jd) {
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
  }

  static NewMoon(k) {
    const T = k / 1236.85;
    const T2 = T * T;
    const T3 = T2 * T;
    const dr = Math.PI / 180;

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
  }

  static getNewMoonDay(k, timeZone) {
    return Math.floor(this.NewMoon(k) + 0.5 + timeZone / 24);
  }

  static sunLongitude(jdn) {
    const T = (jdn - 2451545.0) / 36525;
    const T2 = T * T;
    const dr = Math.PI / 180;
    const M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
    const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
    let DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
    DL += (0.019993 - 0.000101 * T) * Math.sin(2 * dr * M) + 0.000290 * Math.sin(3 * dr * M);
    let L = L0 + DL;
    L *= dr;
    L = L - Math.PI * 2 * Math.floor(L / (Math.PI * 2));
    return L;
  }

  static getSunLongitude(dayNumber, timeZone) {
    return Math.floor((this.sunLongitude(dayNumber - 0.5 - timeZone / 24) / Math.PI) * 6);
  }

  static getLunarMonth11(yy, timeZone) {
    const off = this.jdFromDate(31, 12, yy) - 2415021;
    const k = Math.floor(off / 29.530588853);
    let nm = this.getNewMoonDay(k, timeZone);
    const sunLong = this.getSunLongitude(nm, timeZone);
    if (sunLong >= 9) nm = this.getNewMoonDay(k - 1, timeZone);
    return nm;
  }

  static getLeapMonthOffset(a11, timeZone) {
    const k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853);
    let last = this.getSunLongitude(this.getNewMoonDay(k + 1, timeZone), timeZone);
    let i = 2;
    let arc = this.getSunLongitude(this.getNewMoonDay(k + i, timeZone), timeZone);
    while (arc !== last && i < 15) {
      last = arc;
      i++;
      arc = this.getSunLongitude(this.getNewMoonDay(k + i, timeZone), timeZone);
    }
    return i - 1;
  }

  static solarToLunar(day, month, year, timeZone = LunarCalendar.TIMEZONE) {
    const dayNumber = this.jdFromDate(day, month, year);
    let k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
    let monthStart = this.getNewMoonDay(k + 1, timeZone);

    if (monthStart > dayNumber) {
      monthStart = this.getNewMoonDay(k, timeZone);
    }

    let a11 = this.getLunarMonth11(year, timeZone);
    let b11 = a11;
    let lunarYear;

    if (a11 >= monthStart) {
      lunarYear = year;
      a11 = this.getLunarMonth11(year - 1, timeZone);
    } else {
      lunarYear = year + 1;
      b11 = this.getLunarMonth11(year + 1, timeZone);
    }

    const lunarDay = dayNumber - monthStart + 1;
    let diff = Math.floor((monthStart - a11) / 29);
    let lunarMonth = diff + 11;
    let lunarLeap = false;

    if (b11 - a11 > 365) {
      const leapMonthDiff = this.getLeapMonthOffset(a11, timeZone);
      if (diff >= leapMonthDiff) {
        lunarMonth = diff + 10;
        if (diff === leapMonthDiff) lunarLeap = true;
      }
    }

    if (lunarMonth > 12) {
      lunarMonth -= 12;
    }

    if (lunarMonth >= 11 && diff < 4) {
      lunarYear -= 1;
    }

    return {
      day: lunarDay,
      month: lunarMonth,
      year: lunarYear,
      leap: lunarLeap,
      formatted: `${lunarDay}/${lunarMonth}/${lunarYear}`
    };
  }

  static lunarToSolar(lunarYear, lunarMonth, lunarDay, lunarLeap = false, timeZone = LunarCalendar.TIMEZONE) {
    let a11;
    let b11;

    if (lunarMonth < 11) {
      a11 = this.getLunarMonth11(lunarYear - 1, timeZone);
      b11 = this.getLunarMonth11(lunarYear, timeZone);
    } else {
      a11 = this.getLunarMonth11(lunarYear, timeZone);
      b11 = this.getLunarMonth11(lunarYear + 1, timeZone);
    }

    let k = Math.floor(0.5 + (a11 - 2415021.076998695) / 29.530588853);
    let off = lunarMonth - 11;

    if (off < 0) off += 12;

    if (b11 - a11 > 365) {
      const leapOff = this.getLeapMonthOffset(a11, timeZone);
      let leapMonth = leapOff - 2;
      if (leapMonth < 0) leapMonth += 12;
      if (lunarLeap && lunarMonth !== leapMonth) return null;
      if (lunarLeap || off >= leapOff) off += 1;
    }

    const monthStart = Math.floor(this.NewMoon(k + off) + 0.5 + timeZone / 24);
    const date = this.jdToDate(monthStart + lunarDay - 1);

    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      formatted: `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
    };
  }

  static getZodiacAnimal(lunarYear) {
    const animals = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ',
                     'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
    const index = (lunarYear - 2000) % 12;
    return animals[(index + 12 * 100) % 12];
  }

  static getLunarMonthName(month) {
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
  }

  static getLunarDayName(day) {
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
  }
}

module.exports = LunarCalendar;