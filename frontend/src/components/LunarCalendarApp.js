import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Globe, Heart, LogOut, LogIn } from 'lucide-react';
import { authService } from '../services/authService';
import { calendarService } from '../services/calendarService';

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
    const loadHolidays = async () => {
      try {
        const { data } = await calendarService.getHolidays();
        setHolidays(data.holidays || []);
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
        const dateStr = selectedDate.toISOString().slice(0, 10);
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

  // Improved lunar calendar calculation
  const solarToLunar = (date) => {
    const jd = toJD(date.getFullYear(), date.getMonth() + 1, date.getDate());
    const k = Math.floor((jd - 2451550.1) / 29.53058867);
    let lunarMonth = k % 12 + 1;
    let lunarYear = Math.floor(k / 12) + 2000;
    
    const jd2 = 2451550.09766 + 29.53058867 * k;
    let jdA = jd2;
    
    if (jd >= jdA) {
      while (jd > jdA + 29.53058867) jdA += 29.53058867;
    } else {
      while (jd < jdA) jdA -= 29.53058867;
    }
    
    const lunarDay = jd - jdA + 1;
    return {
      day: Math.floor(lunarDay),
      month: lunarMonth,
      year: lunarYear
    };
  };

  const toJD = (year, month, day) => {
    let a = Math.floor((14 - month) / 12);
    let y = year + 4800 - a;
    let m = month + 12 * a - 3;
    return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateKey = (date) => date.toISOString().slice(0, 10);

  const getHolidayForDate = (date) => {
    const solarKey = `${date.getMonth() + 1}-${date.getDate()}`;
    const lunar = solarToLunar(date);
    const lunarKey = `${lunar.month}-${lunar.day}`;

    return holidays.find(h =>
      (h.type === 'solar' && h.solarDate === solarKey) ||
      (h.type === 'lunar' && h.lunarDate === lunarKey)
    );
  };

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
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
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
          className={`rounded-lg border text-center py-3 px-2 cursor-pointer transition relative bg-white ${
            isSelected
              ? 'border-red-500 text-red-700 shadow-sm'
              : 'border-gray-200 hover:border-red-200 hover:shadow-sm'
          } ${isToday ? 'ring-2 ring-red-200' : ''} ${holiday ? 'bg-red-50' : ''}`}
        >
          <div className="flex justify-between items-start text-sm font-semibold">
            <span>{day}</span>
            {isFav && <Heart size={12} className="fill-red-500 text-red-500" />}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {lunar.day}/{lunar.month}
          </div>
          {holiday && (
            <div className="text-[11px] font-semibold text-red-600 mt-1 leading-tight">
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
    <div className="min-h-screen bg-gray-100">
      <header className="bg-red-700 text-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <h1 className="text-xl md:text-2xl font-semibold">{t.title}</h1>
          <div className="flex items-center gap-2">
            {user ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm"
              >
                <LogOut size={18} />
                {t.logout}
              </button>
            ) : (
              <button
                onClick={() => { setShowAuthModal(true); setAuthMode('login'); }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition text-sm"
              >
                <LogIn size={18} />
                {t.login}
              </button>
            )}
            <button
              onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
              className="flex items-center gap-2 bg-white text-red-700 px-3 md:px-4 py-2 rounded-lg hover:bg-gray-100 transition text-sm font-semibold"
            >
              <Globe size={18} />
              {language === 'vi' ? 'English' : 'Tiếng Việt'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
          <div className="flex items-center justify-center gap-4 mb-4">
            <button onClick={handlePrevMonth} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition">
              <ChevronLeft size={22} />
            </button>
            <h2 className="text-2xl font-bold text-red-700">
              {t.monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button onClick={handleNextMonth} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition">
              <ChevronRight size={22} />
            </button>
          </div>

          <div className="flex justify-center mb-4">
            <button
              onClick={handleToday}
              className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 transition font-semibold"
            >
              {t.today}
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {t.dayNames.map(day => (
              <div key={day} className="text-center font-semibold text-white bg-red-600 py-2 rounded-lg text-sm">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {renderCalendar()}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-red-700">{language === 'vi' ? 'Thông Tin Chi Tiết' : 'Detailed Information'}</h3>
              {selectedDate && (
                <button
                  onClick={() => toggleFavorite(selectedDate)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold border transition ${
                    isFav ? 'border-gray-300 text-gray-700 bg-gray-50' : 'border-red-500 text-red-700 hover:bg-red-50'
                  }`}
                >
                  {isFav ? t.removeFavorite : t.addFavorite}
                </button>
              )}
            </div>

            {loadingDetails ? (
              <p className="text-gray-500">{language === 'vi' ? 'Đang tải dữ liệu...' : 'Loading data...'}</p>
            ) : selectedDate ? (
              <div className="space-y-3 text-sm text-gray-700">
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border bg-gray-50">
                    <p className="text-gray-500 text-xs uppercase tracking-wide">{t.solar}</p>
                    <p className="text-base font-semibold text-gray-800">
                      {selectedDetails?.solar?.formatted || `${selectedDate.getDate()}/${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg border bg-gray-50">
                    <p className="text-gray-500 text-xs uppercase tracking-wide">{t.lunar}</p>
                    <p className="text-base font-semibold text-gray-800">
                      {selectedLunar?.day}/{selectedLunar?.month}/{selectedLunar?.year}
                    </p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border bg-gray-50">
                    <p className="text-gray-500 text-xs uppercase tracking-wide">{t.zodiacYear}</p>
                    <p className="text-base font-semibold text-gray-800">{selectedDetails?.zodiacAnimal || selectedZodiac}</p>
                    {selectedZodiacInfo?.element && (
                      <p className="text-xs text-gray-500 mt-1">{selectedZodiacInfo.element}</p>
                    )}
                  </div>
                  <div className="p-3 rounded-lg border bg-gray-50">
                    <p className="text-gray-500 text-xs uppercase tracking-wide">{t.zodiacSignWestern}</p>
                    <p className="text-base font-semibold text-gray-800">{selectedZodiacSign?.[language] || selectedZodiacSign?.name}</p>
                    {selectedZodiacSign && (
                      <p className="text-xs text-gray-500 mt-1">{selectedZodiacSign.element}</p>
                    )}
                  </div>
                </div>

                {selectedDetails?.notes && (
                  <div className="p-3 rounded-lg border bg-gray-50">
                    <p className="text-gray-500 text-xs uppercase tracking-wide">{language === 'vi' ? 'Ghi chú' : 'Notes'}</p>
                    <p className="text-sm text-gray-700">{selectedDetails.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">{t.selectDate}</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
            <h3 className="text-lg font-semibold text-red-700 mb-3">{language === 'vi' ? 'Những Ngày Lễ Chính' : 'Key Holidays'}</h3>
            {holidays.length ? (
              <ul className="space-y-3">
                {holidays.map((holiday) => (
                  <li key={holiday._id || holiday.name_vi} className="p-3 rounded-lg border bg-gray-50">
                    <p className="font-semibold text-gray-800">{language === 'vi' ? holiday.name_vi : holiday.name_en}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {holiday.type === 'solar'
                        ? `${t.solar}: ${holiday.solarDate}`
                        : `${t.lunar}: ${holiday.lunarDate}`}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm">{language === 'vi' ? 'Không có dữ liệu ngày lễ' : 'No holidays available'}</p>
            )}
          </div>
        </div>
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">{authMode === 'login' ? t.login : t.register}</h2>
            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'register' && (
                <input
                  type="text"
                  placeholder={t.name}
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              )}
              <input
                type="email"
                placeholder={t.email}
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full border rounded px-3 py-2"
              />
              <input
                type="password"
                placeholder={t.password}
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full border rounded px-3 py-2"
              />
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                {authMode === 'login' ? t.login : t.register}
              </button>
              <button
                type="button"
                onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                className="w-full text-blue-600 hover:underline"
              >
                {authMode === 'login' ? t.register : t.login}
              </button>
            </form>
            <button
              onClick={() => setShowAuthModal(false)}
              className="mt-4 w-full bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
            >
              {language === 'vi' ? 'Đóng' : 'Close'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
