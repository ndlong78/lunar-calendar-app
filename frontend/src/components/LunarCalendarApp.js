import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Globe, Heart, LogOut, LogIn } from 'lucide-react';
import { authService } from '../services/authService';
import { calendarService } from '../services/calendarService';
import { ZODIAC_ANIMALS, ZODIAC_SIGNS } from '../utils/constants';
import {
  buildMonthlyLunarMap,
  formatDateKey,
  getAuspiciousHoursForDate,
  getDayCanChi,
  getDaysInMonth,
  getFirstDayOfMonth,
  getLunarKey,
  getZodiacSign,
  solarToLunar
} from '../utils/lunarUtils';

const TEXTS = {
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
    goodDirections: 'Hướng Tốt',
    badDirections: 'Hướng Xấu',
    monthNames: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
    dayNames: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
    selectDate: 'Chọn một ngày để xem thông tin',
    addFavorite: 'Thêm Yêu Thích',
    removeFavorite: 'Bỏ Yêu Thích',
    loginRequired: 'Vui lòng đăng nhập để lưu ngày yêu thích',
    lunarVerbose: 'Âm lịch chi tiết',
    holiday: 'Ngày Lễ',
    lunarDay: 'Ngày',
    lunarMonth: 'Tháng',
    lunarYear: 'Năm',
    lunarLeap: 'nhuận',
    zodiacAnimal: 'Con giáp',
    zodiacElement: 'Ngũ hành',
    zodiacTraits: 'Đặc điểm',
    zodiacPeriod: 'Giai đoạn',
    canChiYear: 'Thiên Can Địa Chi',
    auspiciousTitle: 'Giờ Hoàng Đạo hôm nay',
    goodHours: 'Giờ tốt',
    badHours: 'Giờ xấu',
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
    goodDirections: 'Good Directions',
    badDirections: 'Bad Directions',
    monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    dayNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    selectDate: 'Select a date to view details',
    addFavorite: 'Add Favorite',
    removeFavorite: 'Remove Favorite',
    loginRequired: 'Please login to save favorite dates',
    lunarVerbose: 'Lunar date breakdown',
    holiday: 'Holiday',
    lunarDay: 'Day',
    lunarMonth: 'Month',
    lunarYear: 'Year',
    lunarLeap: 'leap',
    zodiacAnimal: 'Zodiac animal',
    zodiacElement: 'Element',
    zodiacTraits: 'Traits',
    zodiacPeriod: 'Period',
    canChiYear: 'Heavenly Stem & Earthly Branch',
    auspiciousTitle: 'Today\'s auspicious hours',
    goodHours: 'Auspicious',
    badHours: 'Inauspicious',
  }
};

const ZODIAC_EMOJI = {
  'Tý': '🐭',
  'Sửu': '🐮',
  'Dần': '🐯',
  'Mão': '🐰',
  'Thìn': '🐲',
  'Tỵ': '🐍',
  'Ngọ': '🐴',
  'Mùi': '🐏',
  'Thân': '🐒',
  'Dậu': '🐔',
  'Tuất': '🐶',
  'Hợi': '🐷'
};

const WESTERN_ZODIAC_SYMBOLS = {
  'Bạch Dương': '♈',
  'Kim Ngưu': '♉',
  'Song Tử': '♊',
  'Cự Giải': '♋',
  'Sư Tử': '♌',
  'Xử Nữ': '♍',
  'Thiên Bình': '♎',
  'Bọ Cạp': '♏',
  'Nhân Mã': '♐',
  'Ma Kết': '♑',
  'Bảo Bình': '♒',
  'Song Cá': '♓'
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
  const monthLunarMap = useMemo(() => buildMonthlyLunarMap(currentDate), [currentDate]);
  const holidayLookup = useMemo(() => {
    const solar = new Map();
    const lunar = new Map();

    holidays.forEach((holiday) => {
      if (holiday.type === 'solar' && holiday.solarDate) {
        const list = solar.get(holiday.solarDate) || [];
        list.push(holiday);
        solar.set(holiday.solarDate, list);
      }

      if (holiday.type === 'lunar' && holiday.lunarDate) {
        const list = lunar.get(holiday.lunarDate) || [];
        list.push(holiday);
        lunar.set(holiday.lunarDate, list);
      }
    });

    return { solar, lunar };
  }, [holidays]);

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
        const { data: conversion } = await calendarService.convertDate(dateStr);
        const lunarYear = conversion?.lunar?.year || solarToLunar(selectedDate).year;
        const { data: zodiacInfo } = await calendarService.getZodiacInfo(lunarYear);

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

  const t = TEXTS[language];

  const monthlyHolidays = useMemo(() => {
    if (!holidays.length) return [];

    const year = currentDate.getFullYear();
    const monthIndex = currentDate.getMonth();
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
        const matches = monthLunarMap.get(holiday.lunarDate) || [];

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
  }, [currentDate, holidays, monthLunarMap]);

  const getHolidayForDate = (date) => {
    const solarKey = `${date.getMonth() + 1}-${date.getDate()}`;
    const lunar = solarToLunar(date);
    const lunarKey = getLunarKey(lunar);

    return holidayLookup.solar.get(solarKey)?.[0]
      || holidayLookup.lunar.get(lunarKey)?.[0];
  };

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

  const computedLunar = useMemo(() => selectedDate ? solarToLunar(selectedDate) : null, [selectedDate]);
  const selectedLunar = selectedDetails?.lunar || computedLunar;
  const selectedZodiacAnimal = selectedLunar
    ? ZODIAC_ANIMALS[((selectedLunar.year - 4) % 12 + 12) % 12]
    : selectedDetails?.zodiacAnimal;
  const selectedCanChiYear = selectedLunar?.canChiYear;
  const dayCanChi = useMemo(() => selectedDate ? getDayCanChi(selectedDate) : null, [selectedDate]);
  const auspiciousHours = useMemo(
    () => selectedDate ? getAuspiciousHoursForDate(selectedDate, language) : { good: [], bad: [], dayBranch: null },
    [selectedDate, language]
  );
  const selectedZodiacSign = selectedDate ? getZodiacSign(selectedDate, ZODIAC_SIGNS) : null;
  const selectedZodiacInfo = selectedDetails?.zodiacInfo;
  const isFav = selectedDate ? isFavorite(selectedDate) : false;
  const lunarDayDisplay = selectedLunar?.dayName ? `${selectedLunar.dayName} (${selectedLunar.day})` : selectedLunar?.day;
  const lunarMonthDisplay = selectedLunar?.monthName ? `${selectedLunar.monthName} (${selectedLunar.month})` : selectedLunar?.month;
  const zodiacDisplay = selectedCanChiYear || selectedZodiacAnimal || selectedDetails?.zodiacAnimal;
  const holidayForSelectedDate = selectedDate ? getHolidayForDate(selectedDate) : null;
  const zodiacEmoji = selectedZodiacAnimal ? ZODIAC_EMOJI[selectedZodiacAnimal] : '';
  const westernZodiacSymbol = selectedZodiacSign ? WESTERN_ZODIAC_SYMBOLS[selectedZodiacSign.vi] : '';

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
              <div className="details-stack">
                <section className="detail-section">
                  <div className="section-heading">
                    <span className="section-icon">📅</span>
                    <div>
                      <p className="detail-label">{t.solar}</p>
                      <p className="date-large">
                        {selectedDetails?.solar?.formatted || `${selectedDate.getDate()}/${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`}
                      </p>
                    </div>
                  </div>
                </section>

                {holidayForSelectedDate && (
                  <section className="detail-section holiday-banner">
                    <div className="holiday-icon">🎉</div>
                    <div>
                      <p className="holiday-title">{language === 'vi' ? holidayForSelectedDate.name_vi : holidayForSelectedDate.name_en}</p>
                      {holidayForSelectedDate.is_public_holiday && (
                        <span className="badge-official">{language === 'vi' ? 'Ngày nghỉ chính thức' : 'Public holiday'}</span>
                      )}
                      <p className="holiday-meta">
                        {holidayForSelectedDate.type === 'lunar'
                          ? `🌙 ${t.lunar}: ${holidayForSelectedDate.lunarDate}`
                          : `📅 ${t.solar}: ${holidayForSelectedDate.solarDate}`}
                      </p>
                    </div>
                  </section>
                )}

                <section className="detail-section">
                  
                  <div className="lunar-grid">
                    <div className="lunar-chip">
                      <p className="chip-label">{t.lunarDay}</p>
                      <p className="chip-value">{lunarDayDisplay}</p>
                    </div>
                    <div className="lunar-chip">
                      <p className="chip-label">{t.lunarMonth}</p>
                      <p className="chip-value">
                        {lunarMonthDisplay}
                        {selectedLunar?.leap && <span className="leap-badge">{t.lunarLeap}</span>}
                      </p>
                    </div>
                    <div className="lunar-chip">
                      <p className="chip-label">{t.lunarYear}</p>
                      <p className="chip-value">{selectedLunar?.year}</p>
                    </div>
                  </div>
                  {selectedCanChiYear && (
                    <p className="detail-subtext canchi-row">🗓️ {t.canChiYear}: <strong>{selectedCanChiYear}</strong></p>
                  )}
                </section>

                <section className="detail-section">
                  <div className="section-heading">
                    <span className="section-icon">🗓️</span>
                    <div>
                      <p className="detail-label">{t.zodiacYear}</p>
                      <p className="detail-value emphasis">{zodiacDisplay}</p>
                      {selectedZodiacAnimal && (
                        <span className="zodiac-emoji">{zodiacEmoji} {selectedZodiacAnimal}</span>
                      )}
                    </div>
                  </div>
                  {selectedZodiacInfo && (
                    <div className="zodiac-info-grid">
                      <div>
                        <p className="chip-label">{t.zodiacElement}</p>
                        <p className="chip-value">{selectedZodiacInfo.element}</p>
                      </div>
                      <div>
                        <p className="chip-label">{t.zodiacTraits}</p>
                        <p className="chip-value">{selectedZodiacInfo.personality}</p>
                      </div>
                    </div>
                  )}
                </section>

                {selectedZodiacSign && (
                  <section className="detail-section">
                    <div className="section-heading">
                      <span className="section-icon">🔮</span>
                      <div>
                        <p className="detail-label">{t.zodiacSignWestern}</p>
                        <p className="detail-value emphasis">{westernZodiacSymbol} {selectedZodiacSign[language] || selectedZodiacSign.name}</p>
                      </div>
                    </div>
                    <div className="zodiac-info-grid">
                      <div>
                        <p className="chip-label">{t.zodiacElement}</p>
                        <p className="chip-value">{selectedZodiacSign.element}</p>
                      </div>
                      <div>
                        <p className="chip-label">{t.zodiacPeriod}</p>
                        <p className="chip-value">{selectedZodiacSign.dates}</p>
                      </div>
                    </div>
                  </section>
                )}

                <section className="detail-section">
                  <div className="section-heading">
                    <span className="section-icon">⭐</span>
                    <div>
                      <p className="detail-label">{t.auspiciousTitle}</p>
                      {dayCanChi && (
                        <p className="chip-label">
                          {language === 'vi'
                            ? `Ngày ${dayCanChi.label}`
                            : `Day ${dayCanChi.label}`}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="hours-grid">
                    <div>
                      <p className="chip-label">✅ {t.goodHours}</p>
                      <div className="hour-chips">
                        {auspiciousHours.good.map((hour) => (
                          <span key={hour} className="hour-badge good">🟢 {hour}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="chip-label">❌ {t.badHours}</p>
                      <div className="hour-chips">
                        {auspiciousHours.bad.map((hour) => (
                          <span key={hour} className="hour-badge bad">🔴 {hour}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                {selectedDetails?.notes && (
                  <section className="detail-section">
                    <div className="section-heading">
                      <span className="section-icon">📝</span>
                      <p className="detail-label">{language === 'vi' ? 'Ghi chú' : 'Notes'}</p>
                    </div>
                    <p className="detail-description">{selectedDetails.notes}</p>
                  </section>
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
