import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Globe, Heart, LogOut, LogIn } from 'lucide-react';
import { authService } from '../services/authService';
import { calendarService } from '../services/calendarService';

const TIMEZONE = 7.0; // Vietnam GMT+7
const PI = Math.PI;

const jdFromDate = (dd, mm, yy) => {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  return dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) -
    Math.floor(y / 100) + Math.floor(y / 400) - 32045;
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

const getNewMoonDay = (k) => {
  return Math.floor(NewMoon(k) + 0.5 + TIMEZONE / 24);
};

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

const getSunLongitude = (dayNumber) => {
  return Math.floor((sunLongitude(dayNumber - 0.5 - TIMEZONE / 24) / Math.PI) * 6);
};

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

export default function LunarCalendarApp({ user, setUser, setIsAdmin }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [language, setLanguage] = useState('vi');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [favorites, setFavorites] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [holidays, setHolidays] = useState([]);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    const normalizeHoliday = (item = {}) => {
      const inferredType = item.type || (item.calendar === 'solar' ? 'solar' : item.calendar === 'lunar' ? 'lunar' : undefined);
      const solarDate = item.solarDate
        || (inferredType === 'solar' && item.month && item.day ? `${item.month}-${item.day}` : undefined);
      const lunarMonth = item.lunar_month || item.lunarMonth;
      const lunarDay = item.lunar_day || item.lunarDay;
      const lunarDate = item.lunarDate || (inferredType === 'lunar' && lunarMonth && lunarDay ? `${lunarMonth}-${lunarDay}` : undefined);

      return {
        ...item,
        code: item.code || item.id,
        type: inferredType,
        solarDate,
        lunarDate
      };
    };

    const loadHolidays = async () => {
      try {
        const { data } = await calendarService.getHolidays();
        const holidayList = data.holidays || data.items || [];
        const normalized = holidayList
          .map(normalizeHoliday)
          .filter(h => h.type && (h.solarDate || h.lunarDate));
        setHolidays(normalized);
      } catch (error) {
        console.error('Không thể tải ngày lễ', error);
      }
    };

    loadHolidays();
  }, []);

  useEffect(() => {
    const loadFavorites = async () => {
      if (!user) {
        setFavorites([]);
        return;
      }

      try {
        const { data } = await calendarService.getFavorites();
        setFavorites(data.favorites || []);
      } catch (error) {
        console.error('Không thể tải danh sách yêu thích', error);
      }
    };

    loadFavorites();
  }, [user]);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!selectedDate) return;

      setLoadingDetails(true);
      try {
        const dateStr = formatDateKey(selectedDate);
        const [{ data: conversion }, { data: zodiacInfo }] = await Promise.all([
          calendarService.convertDate(dateStr),
          calendarService.getZodiacInfo(selectedDate.getFullYear())
        ]);

        setSelectedDetails({
          ...conversion,
          zodiacInfo
        });
      } catch (error) {
        console.error('Không thể lấy thông tin ngày', error);
      } finally {
        setLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [selectedDate]);

  // Zodiac Animals
  const ZODIAC_ANIMALS = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
  
  // Zodiac Signs (12 Cung Mệnh)
  const ZODIAC_SIGNS = [
    { name: 'Bạch Dương', vi: 'Bạch Dương', en: 'Aries', dates: '3/21-4/19', element: 'Lửa', characteristic: 'Táo bạo, năng động' },
    { name: 'Kim Ngưu', vi: 'Kim Ngưu', en: 'Taurus', dates: '4/20-5/20', element: 'Đất', characteristic: 'Vững chắc, trung thực' },
    { name: 'Song Tử', vi: 'Song Tử', en: 'Gemini', dates: '5/21-6/20', element: 'Không khí', characteristic: 'Thông minh, linh hoạt' },
    { name: 'Cự Giải', vi: 'Cự Giải', en: 'Cancer', dates: '6/21-7/22', element: 'Nước', characteristic: 'Nhạy cảm, chân thành' },
    { name: 'Sư Tử', vi: 'Sư Tử', en: 'Leo', dates: '7/23-8/22', element: 'Lửa', characteristic: 'Tự tin, lãnh đạo' },
    { name: 'Xử Nữ', vi: 'Xử Nữ', en: 'Virgo', dates: '8/23-9/22', element: 'Đất', characteristic: 'Cẩn thận, chi tiết' },
    { name: 'Thiên Bình', vi: 'Thiên Bình', en: 'Libra', dates: '9/23-10/22', element: 'Không khí', characteristic: 'Cân bằng, công bằng' },
    { name: 'Bọ Cạp', vi: 'Bọ Cạp', en: 'Scorpio', dates: '10/23-11/21', element: 'Nước', characteristic: 'Sâu sắc, bí ẩn' },
    { name: 'Nhân Mã', vi: 'Nhân Mã', en: 'Sagittarius', dates: '11/22-12/21', element: 'Lửa', characteristic: 'Lạc quan, tự do' },
    { name: 'Ma Kết', vi: 'Ma Kết', en: 'Capricorn', dates: '12/22-1/19', element: 'Đất', characteristic: 'Kỷ luật, trách nhiệm' },
    { name: 'Bảo Bình', vi: 'Bảo Bình', en: 'Aquarius', dates: '1/20-2/18', element: 'Không khí', characteristic: 'Độc lập, sáng tạo' },
    { name: 'Song Cá', vi: 'Song Cá', en: 'Pisces', dates: '2/19-3/20', element: 'Nước', characteristic: 'Mơ mộng, giàu lòng trắc ẩn' }
  ];

  const solarToLunar = (date) => {
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

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getHolidayForDate = (date) => {
    const solarKey = `${date.getMonth() + 1}-${date.getDate()}`;
    const lunar = solarToLunar(date);
    const lunarKey = `${lunar.month}-${lunar.day}`;

    return holidays.find(h =>
      (h.type === 'solar' && h.solarDate === solarKey) ||
      (h.type === 'lunar' && h.lunarDate === lunarKey)
    );
  };

  const monthlyHolidays = useMemo(() => {
    if (!holidays.length) return [];

    const daysInMonth = getDaysInMonth(currentDate);
    const year = currentDate.getFullYear();
    const monthIndex = currentDate.getMonth();
    const lunarLookup = new Map();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, monthIndex, day);
      const lunar = solarToLunar(date);
      const key = `${lunar.month}-${lunar.day}`;
      const entries = lunarLookup.get(key) || [];
      entries.push({ date, lunar });
      lunarLookup.set(key, entries);
    }

    const items = [];
    const seen = new Set();

    holidays.forEach((holiday) => {
      if (holiday.type === 'solar' && holiday.solarDate) {
        const [month, day] = holiday.solarDate.split('-').map(Number);
        if (month === monthIndex + 1) {
          const date = new Date(year, monthIndex, day);
          const lunar = solarToLunar(date);
          const key = `${holiday.code || holiday._id || holiday.name_vi}-${date.toDateString()}`;

          if (!seen.has(key)) {
            items.push({
              ...holiday,
              date,
              solarDisplay: `${day}/${month}`,
              lunarDisplay: `${lunar.day}/${lunar.month}`
            });
            seen.add(key);
          }
        }
      }

      if (holiday.type === 'lunar' && holiday.lunarDate) {
        const [lunarMonth, lunarDay] = holiday.lunarDate.split('-').map(Number);
        const matches = lunarLookup.get(`${lunarMonth}-${lunarDay}`) || [];

        matches.forEach(({ date, lunar }) => {
          const key = `${holiday.code || holiday._id || holiday.name_vi}-${date.toDateString()}`;

          if (!seen.has(key)) {
            items.push({
              ...holiday,
              date,
              solarDisplay: `${date.getDate()}/${monthIndex + 1}`,
              lunarDisplay: `${lunar.day}/${lunar.month}`
            });
            seen.add(key);
          }
        });
      }
    });

    return items.sort((a, b) => a.date - b.date);
  }, [currentDate, holidays]);

  const getZodiacSign = (date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dateNum = month * 100 + day;

    for (let sign of ZODIAC_SIGNS) {
      const [start, end] = sign.dates.split('-').map(x => {
        const [mm, dd] = x.split('/');
        return parseInt(mm) * 100 + parseInt(dd);
      }).sort((a, b) => a - b);

      if (start <= end) {
        if (dateNum >= start && dateNum <= end) return sign;
      } else {
        if (dateNum >= start || dateNum <= end) return sign;
      }
    }
    return ZODIAC_SIGNS[0];
  };

  const texts = {
    vi: {
      title: 'Âm Dương Lịch Việt Nam',
      calendar: 'Lịch',
      zodiac: 'Tử Vi',
      fengshui: 'Phong Thủy',
      favorites: 'Yêu Thích',
      login: 'Đăng Nhập',
      logout: 'Đăng Xuất',
      register: 'Đăng Ký',
      email: 'Email',
      password: 'Mật Khẩu',
      name: 'Tên',
      solar: 'Dương Lịch',
      lunar: 'Âm Lịch',
      today: 'Hôm Nay',
      zodiacYear: 'Năm',
      zodiacSign: 'Chi',
      zodiacSignWestern: 'Cung Mệnh',
      element: 'Ngũ Hành',
      characteristic: 'Đặc Điểm',
      auspiciousHours: 'Giờ Hoàng Đạo',
      inauspiciousHours: 'Giờ Hắc Đạo',
      fengShuiTips: 'Gợi Ý Phong Thủy',
      goodDirections: 'Hướng Tốt',
      badDirections: 'Hướng Xấu',
      monthNames: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
      dayNames: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
      selectDate: 'Chọn một ngày để xem thông tin',
      addFavorite: 'Thêm Yêu Thích',
      removeFavorite: 'Bỏ Yêu Thích',
      loginRequired: 'Vui lòng đăng nhập để lưu ngày yêu thích',
    },
    en: {
      title: 'Vietnamese Lunar & Solar Calendar',
      calendar: 'Calendar',
      zodiac: 'Zodiac',
      fengshui: 'Feng Shui',
      favorites: 'Favorites',
      login: 'Login',
      logout: 'Logout',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      name: 'Name',
      solar: 'Solar',
      lunar: 'Lunar',
      today: 'Today',
      zodiacYear: 'Year',
      zodiacSign: 'Animal Sign',
      zodiacSignWestern: 'Zodiac Sign',
      element: 'Element',
      characteristic: 'Characteristics',
      auspiciousHours: 'Auspicious Hours',
      inauspiciousHours: 'Inauspicious Hours',
      fengShuiTips: 'Feng Shui Tips',
      goodDirections: 'Good Directions',
      badDirections: 'Bad Directions',
      monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      dayNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      selectDate: 'Select a date to view details',
      addFavorite: 'Add Favorite',
      removeFavorite: 'Remove Favorite',
      loginRequired: 'Please login to save favorite dates',
    }
  };

  const t = texts[language];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (authMode === 'login') {
        const { data } = await authService.login(formData.email, formData.password);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setIsAdmin?.(data.user.role === 'admin');
      } else {
        const { data } = await authService.register(formData.name, formData.email, formData.password);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        setIsAdmin?.(data.user.role === 'admin');
      }

      setFormData({ email: '', password: '', name: '' });
      setShowAuthModal(false);
    } catch (error) {
      const message = error.response?.data?.message || 'Đăng nhập/đăng ký thất bại';
      alert(message);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setIsAdmin?.(false);
    setFavorites([]);
  };

  const toggleFavorite = (date) => {
    if (!user) {
      alert(t.loginRequired);
      return;
    }

    const dateKey = formatDateKey(date);
    const existing = favorites.find(fav => formatDateKey(new Date(fav.date)) === dateKey);

    const updateFavorites = async () => {
      try {
        if (existing) {
          await calendarService.deleteFavorite(existing._id);
          setFavorites(prev => prev.filter(f => f._id !== existing._id));
        } else {
          const payload = {
            date: dateKey,
            solarDate: selectedDetails?.solar?.formatted || `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`,
            lunarDate: selectedDetails?.lunar?.formatted || ''
          };
          const { data } = await calendarService.addFavorite(payload);
          setFavorites(prev => [data.favorite, ...prev]);
        }
      } catch (error) {
        console.error('Không thể cập nhật yêu thích', error);
        alert('Không thể cập nhật yêu thích');
      }
    };

    updateFavorites();
  };

  const isFavorite = (date) => {
    const dateKey = formatDateKey(date);
    return favorites.some(fav => formatDateKey(new Date(fav.date)) === dateKey);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

      for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="empty-day"></div>);
      }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isToday = new Date().toDateString() === date.toDateString();
      const isSelected = selectedDate?.toDateString() === date.toDateString();

      const lunar = solarToLunar(date);
      const holiday = getHolidayForDate(date);
      const isFav = isFavorite(date);

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`day-cell ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${holiday ? 'holiday' : ''}`}
        >
          <div className="day-number-row">
            <span>{day}</span>
            {isFav && <Heart size={12} className="day-favorite" />}
          </div>
          <div className="day-lunar">
            {lunar.day}/{lunar.month}
          </div>
          {holiday && (
            <div className="day-holiday-label">
              {language === 'vi' ? holiday.name_vi : holiday.name_en}
            </div>
          )}
        </div>
      );
}

    return days;
  };

  const selectedLunar = selectedDetails?.lunar || (selectedDate ? solarToLunar(selectedDate) : null);
  const selectedZodiac = selectedDetails?.zodiacAnimal || (selectedDate ? ZODIAC_ANIMALS[selectedDate.getFullYear() % 12] : null);
  const selectedZodiacSign = selectedDate ? getZodiacSign(selectedDate) : null;
  const selectedZodiacInfo = selectedDetails?.zodiacInfo;
  const isFav = selectedDate ? isFavorite(selectedDate) : false;

  return (
    <div className="app">
      <header className="header">
        <div className="container header-content">
          <h1 className="header-title">{t.title}</h1>
          <div className="action-row">
            {user ? (
              <button
                onClick={handleLogout}
                className="ghost-button"
              >
                <LogOut size={18} />
                {t.logout}
              </button>
            ) : (
              <button
                onClick={() => { setShowAuthModal(true); setAuthMode('login'); }}
                className="ghost-button"
              >
                <LogIn size={18} />
                {t.login}
              </button>
            )}
            <button
              onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
              className="language-button"
            >
              <Globe size={18} />
              {language === 'vi' ? 'English' : 'Tiếng Việt'}
            </button>
          </div>
        </div>
      </header>

      <main className="container main-content">
        <div className="card">
          <div className="month-nav">
            <button onClick={handlePrevMonth} className="month-button" aria-label="Previous month">
              <ChevronLeft size={20} />
            </button>
            <h2 className="month-title">
              {t.monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button onClick={handleNextMonth} className="month-button" aria-label="Next month">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="today-row">
            <button
              onClick={handleToday}
              className="primary-button"
            >
              {t.today}
            </button>
          </div>

          <div className="day-names">
            {t.dayNames.map(day => (
              <div key={day} className="day-name">
                {day}
              </div>
            ))}
          </div>

          <div className="calendar-grid">
            {renderCalendar()}
          </div>
        </div>

        <div className="info-grid">
          <div className="card">
            <div className="section-header">
              <h3 className="section-title">{language === 'vi' ? 'Thông Tin Chi Tiết' : 'Detailed Information'}</h3>
              {selectedDate && (
                <button
                  onClick={() => toggleFavorite(selectedDate)}
                  className={`outline-button ${isFav ? 'outline-button-muted' : 'outline-button-accent'}`}
                >
                  {isFav ? t.removeFavorite : t.addFavorite}
                </button>
              )}
            </div>

            {loadingDetails ? (
              <p className="muted-text">{language === 'vi' ? 'Đang tải dữ liệu...' : 'Loading data...'}</p>
            ) : selectedDate ? (
              <div className="details-grid">
                <div className="detail-box">
                  <p className="detail-label">{t.solar}</p>
                  <p className="detail-value">
                    {selectedDetails?.solar?.formatted || `${selectedDate.getDate()}/${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`}
                  </p>
                </div>
                <div className="detail-box">
                  <p className="detail-label">{t.lunar}</p>
                  <p className="detail-value">
                    {selectedLunar?.day}/{selectedLunar?.month}/{selectedLunar?.year}
                  </p>
                </div>
                <div className="detail-box">
                  <p className="detail-label">{t.zodiacYear}</p>
                  <p className="detail-value">{selectedDetails?.zodiacAnimal || selectedZodiac}</p>
                  {selectedZodiacInfo?.element && (
                    <p className="detail-subtext">{selectedZodiacInfo.element}</p>
                  )}
                </div>
                <div className="detail-box">
                  <p className="detail-label">{t.zodiacSignWestern}</p>
                  <p className="detail-value">{selectedZodiacSign?.[language] || selectedZodiacSign?.name}</p>
                  {selectedZodiacSign && (
                    <p className="detail-subtext">{selectedZodiacSign.element}</p>
                  )}
                </div>
                {selectedDetails?.notes && (
                  <div className="detail-box detail-notes">
                    <p className="detail-label">{language === 'vi' ? 'Ghi chú' : 'Notes'}</p>
                    <p className="detail-description">{selectedDetails.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="muted-text">{t.selectDate}</p>
            )}
          </div>

          <div className="card">
            <h3 className="section-title">{language === 'vi' ? 'Những Ngày Lễ Chính' : 'Key Holidays'}</h3>
            {monthlyHolidays.length ? (
              <ul className="holiday-list">
                {monthlyHolidays.map((holiday) => (
                  <li key={`${holiday.code || holiday._id}-${holiday.solarDisplay}-${holiday.lunarDisplay}`} className="holiday-item">
                    <p className="holiday-name">{language === 'vi' ? holiday.name_vi : holiday.name_en}</p>
                    <p className="holiday-meta">
                      {holiday.type === 'solar'
                        ? `${t.solar}: ${holiday.solarDisplay}`
                        : `${t.lunar}: ${holiday.lunarDisplay}`}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted-text small-text">{language === 'vi' ? 'Không có ngày lễ trong tháng' : 'No holidays this month'}</p>
            )}
          </div>
        </div>
      </main>

      {showAuthModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-title">{authMode === 'login' ? t.login : t.register}</h2>
            <form onSubmit={handleAuth} className="modal-form">
              {authMode === 'register' && (
                <input
                  type="text"
                  placeholder={t.name}
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="input"
                />
              )}
              <input
                type="email"
                placeholder={t.email}
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="input"
              />
              <input
                type="password"
                placeholder={t.password}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="input"
              />
              <button type="submit" className="primary-button full-width">
                {authMode === 'login' ? t.login : t.register}
              </button>
              <button
                type="button"
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="link-button"
              >
                {authMode === 'login' ? t.register : t.login}
              </button>
            </form>
            <button
              onClick={() => setShowAuthModal(false)}
              className="secondary-button full-width"
            >
              {language === 'vi' ? 'Đóng' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
