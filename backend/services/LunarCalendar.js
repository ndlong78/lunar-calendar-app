class LunarCalendar {
  static K1 = 365.2425;
  static K2 = 29.53058867;

  static jdToDate(jd) {
    const l = Math.floor(jd + 0.5) + 68569;
    const n = Math.floor((4 * l) / 146097);
    const l2 = l - Math.floor((146097 * n + 3) / 4);
    const i = Math.floor((4000 * (l2 + 1)) / 1461001);
    const l3 = l2 - Math.floor((1461 * i) / 4) + 31;
    const j = Math.floor((80 * l3) / 2447);
    const d = l3 - Math.floor((2447 * j) / 80);
    const l4 = Math.floor(j / 11);
    const m = j + 2 - 12 * l4;
    const y = 100 * (n - 49) + i + l4;

    return new Date(y, m - 1, d);
  }

  static dateToJd(year, month, day) {
    const a = Math.floor((14 - month) / 12);
    const y = year + 4800 - a;
    const m = month + 12 * a - 3;
    return day + Math.floor((153 * m + 2) / 5) + 365 * y + 
           Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  }

  static getNewMoonJd(k) {
    const T = k / 1236.85;
    const JDE = 2451550.09766 + 29.530588861 * k
      + 0.00015437 * T * T
      - 0.000000150 * T * T * T
      + 0.00000011 * T * T * T * T;

    const E = 1 - 0.002516 * T - 0.0000074 * T * T;
    const M = 2.5534 + 29.10535670 * k
      - 0.0000014 * T * T
      - 0.11 * T * T * T;
    const Mprime = 201.5643 + 385.81693528 * k
      + 0.0107582 * T * T
      + 0.00001238 * T * T * T
      - 0.000000058 * T * T * T * T;
    const F = 160.7108 + 390.67050284 * k
      - 0.0016118 * T * T
      - 0.00000227 * T * T * T
      + 0.000000011 * T * T * T * T;

    const corrections = [
      { coeff: -0.40720, mult: () => Math.sin((Mprime * Math.PI) / 180) },
      { coeff: 0.17241 * E, mult: () => Math.sin((M * Math.PI) / 180) },
      { coeff: -0.01608, mult: () => Math.sin((2 * Mprime * Math.PI) / 180) },
      { coeff: 0.01039, mult: () => Math.sin((2 * F * Math.PI) / 180) },
      { coeff: 0.00739 * E, mult: () => Math.sin(((Mprime - M) * Math.PI) / 180) },
      { coeff: -0.00514 * E, mult: () => Math.sin(((Mprime + M) * Math.PI) / 180) },
      { coeff: 0.00208 * E * E, mult: () => Math.sin((2 * M * Math.PI) / 180) },
      { coeff: 0.00111, mult: () => Math.sin(((Mprime - 2 * F) * Math.PI) / 180) }
    ];

    let correction = 0;
    corrections.forEach(c => {
      correction += c.coeff * c.mult();
    });

    return JDE + correction;
  }

  static solarToLunar(solarYear, solarMonth, solarDay) {
    const jd = this.dateToJd(solarYear, solarMonth, solarDay) + 0.5;
    
    let k = (jd - 2451550.1) / 29.53058867;
    k = Math.floor(k);

    let newMoonJd = this.getNewMoonJd(k);

    if (newMoonJd > jd) {
      k--;
      newMoonJd = this.getNewMoonJd(k);
    }

    let nextNewMoonJd = this.getNewMoonJd(k + 1);
    if (jd >= nextNewMoonJd) {
      k++;
      newMoonJd = nextNewMoonJd;
      nextNewMoonJd = this.getNewMoonJd(k + 1);
    }

    const lunarDay = Math.floor(jd - newMoonJd) + 1;
    let lunarMonth = k % 12 + 1;
    let lunarYear = Math.floor(k / 12) + 2000;

    return {
      day: lunarDay,
      month: lunarMonth,
      year: lunarYear,
      formatted: `${lunarDay}/${lunarMonth}/${lunarYear}`
    };
  }

  static lunarToSolar(lunarYear, lunarMonth, lunarDay) {
    let k = (lunarYear - 2000) * 12 + lunarMonth - 1;
    const newMoonJd = this.getNewMoonJd(k);
    const jd = newMoonJd + lunarDay - 1;
    const date = this.jdToDate(jd);

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
    return animals[(lunarYear - 2000) % 12];
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