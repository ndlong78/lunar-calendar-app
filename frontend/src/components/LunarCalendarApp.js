import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Globe, Heart, LogOut, LogIn, Save } from 'lucide-react';

export default function LunarCalendarApp() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 11, 9));
  const [language, setLanguage] = useState('vi');
  const [selectedDate, setSelectedDate] = useState(null);
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [activeTab, setActiveTab] = useState('calendar');

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

  // Vietnamese Holidays
  const VIETNAMESE_HOLIDAYS = {
    '1-1': { vi: 'Tết Dương Lịch', en: 'New Year', type: 'solar' },
    '2-10': { vi: 'Ngày Lao Động', en: 'Labor Day', type: 'solar' },
    '4-30': { vi: 'Ngày Giải Phóng', en: 'Reunification Day', type: 'solar' },
    '9-2': { vi: 'Ngày Quốc Khánh', en: 'National Day', type: 'solar' },
    'lunar-1-1': { vi: 'Tết Nguyên Đán', en: 'Lunar New Year', type: 'lunar' },
    'lunar-1-15': { vi: 'Tết Nguyên Tiêu', en: 'Full Moon Festival', type: 'lunar' },
    'lunar-3-10': { vi: 'Giỗ Tổ Hùng Vương', en: 'Hung Kings Festival', type: 'lunar' },
    'lunar-8-15': { vi: 'Tết Trung Thu', en: 'Mid-Autumn Festival', type: 'lunar' },
  };

  // Auspicious/Inauspicious hours (Giờ Hoàng Đạo/Hắc Đạo)
  const AUSPICIOUS_HOURS = {
    0: { vi: 'Tý (23-1)', en: 'Rat (11pm-1am)', auspicious: true },
    1: { vi: 'Sửu (1-3)', en: 'Ox (1am-3am)', auspicious: false },
    2: { vi: 'Dần (3-5)', en: 'Tiger (3am-5am)', auspicious: true },
    3: { vi: 'Mão (5-7)', en: 'Rabbit (5am-7am)', auspicious: false },
    4: { vi: 'Thìn (7-9)', en: 'Dragon (7am-9am)', auspicious: true },
    5: { vi: 'Tỵ (9-11)', en: 'Snake (9am-11am)', auspicious: false },
    6: { vi: 'Ngọ (11-13)', en: 'Horse (11am-1pm)', auspicious: true },
    7: { vi: 'Mùi (13-15)', en: 'Goat (1pm-3pm)', auspicious: false },
    8: { vi: 'Thân (15-17)', en: 'Monkey (3pm-5pm)', auspicious: true },
    9: { vi: 'Dậu (17-19)', en: 'Rooster (5pm-7pm)', auspicious: false },
    10: { vi: 'Tuất (19-21)', en: 'Dog (7pm-9pm)', auspicious: true },
    11: { vi: 'Hợi (21-23)', en: 'Pig (9pm-11pm)', auspicious: false }
  };

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

  const getZodiacSign = (date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dateNum = month * 100 + day;
    
    for (let sign of ZODIAC_SIGNS) {
      const [m1, d1, m2, d2] = sign.dates.split('-').map(x => {
        const [mm, dd] = x.split('/');
        return parseInt(mm) * 100 + parseInt(dd);
      }).sort((a, b) => a - b);
      
      if (m1 <= m2) {
        if (dateNum >= m1 && dateNum <= m2) return sign;
      } else {
        if (dateNum >= m1 || dateNum <= m2) return sign;
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
    // Simulated auth - in real app, call backend API
    if (authMode === 'login') {
      setUser({ email: formData.email, name: 'User' });
    } else {
      setUser({ email: formData.email, name: formData.name });
    }
    setFormData({ email: '', password: '', name: '' });
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setUser(null);
    setFavorites([]);
  };

  const toggleFavorite = (date) => {
    if (!user) {
      alert(t.loginRequired);
      return;
    }
    const dateStr = date.toISOString().split('T')[0];
    setFavorites(prev => 
      prev.includes(dateStr) 
        ? prev.filter(d => d !== dateStr)
        : [...prev, dateStr]
    );
  };

  const isFavorite = (date) => {
    return favorites.includes(date.toISOString().split('T')[0]);
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
      const dateStr = `${date.getMonth() + 1}-${day}`;
      const isToday = new Date().toDateString() === date.toDateString();
      const isSelected = selectedDate?.toDateString() === date.toDateString();
      const holiday = VIETNAMESE_HOLIDAYS[dateStr];
      
      const lunar = solarToLunar(date);
      const lunarDateStr = `lunar-${lunar.month}-${lunar.day}`;
      const lunarHoliday = VIETNAMESE_HOLIDAYS[lunarDateStr];
      const isFav = isFavorite(date);

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`p-2 border rounded cursor-pointer text-center transition relative ${
            isToday ? 'bg-red-100 border-red-500' : isSelected ? 'bg-blue-100 border-blue-500' : 'border-gray-300 hover:bg-gray-100'
          }`}
        >
          <div className="flex justify-between items-start">
            <div className="font-bold text-sm">{day}</div>
            {isFav && <Heart size={12} className="fill-red-500 text-red-500" />}
          </div>
          <div className="text-xs text-gray-600">
            {lunar.day}/{lunar.month}
          </div>
          {(holiday || lunarHoliday) && (
            <div className="text-xs font-semibold text-red-600 mt-1">
              {holiday ? holiday[language] : lunarHoliday[language]}
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const selectedLunar = selectedDate ? solarToLunar(selectedDate) : null;
  const selectedZodiac = selectedDate ? ZODIAC_ANIMALS[selectedDate.getFullYear() % 12] : null;
  const selectedZodiacSign = selectedDate ? getZodiacSign(selectedDate) : null;
  const isFav = selectedDate ? isFavorite(selectedDate) : false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-yellow-50 to-orange-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl md:text-4xl font-bold text-red-700">{t.title}</h1>
            <div className="flex gap-2">
              <button
                onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
                className="flex items-center gap-2 bg-red-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm"
              >
                <Globe size={18} />
                {language === 'vi' ? 'EN' : 'VN'}
              </button>
              {user ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-gray-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-gray-700 transition text-sm"
                >
                  <LogOut size={18} />
                  {t.logout}
                </button>
              ) : (
                <button
                  onClick={() => { setShowAuthModal(true); setAuthMode('login'); }}
                  className="flex items-center gap-2 bg-blue-600 text-white px-3 md:px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm"
                >
                  <LogIn size={18} />
                  {t.login}
                </button>
              )}
            </div>
          </div>
          {user && <p className="text-sm text-gray-600">👋 {t.email}: {user.email}</p>}
        </div>

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

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['calendar', 'zodiac', 'fengshui'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                activeTab === tab
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {t[tab]}
            </button>
          ))}
        </div>

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-200 rounded transition">
                  <ChevronLeft size={24} />
                </button>
                <h2 className="text-2xl font-bold">
                  {t.monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <button onClick={handleNextMonth} className="p-2 hover:bg-gray-200 rounded transition">
                  <ChevronRight size={24} />
                </button>
              </div>

              <button
                onClick={handleToday}
                className="mb-4 w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
              >
                {t.today}
              </button>

              <div className="grid grid-cols-7 gap-1 mb-4">
                {t.dayNames.map(day => (
                  <div key={day} className="text-center font-bold text-sm text-gray-600 py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {renderCalendar()}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 h-fit">
              <h3 className="text-xl font-bold mb-4 text-red-700">{language === 'vi' ? 'Thông Tin' : 'Details'}</h3>

              {selectedDate ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">{t.solar}</p>
                    <p className="text-lg font-bold">
                      {selectedDate.getDate()}/{selectedDate.getMonth() + 1}/{selectedDate.getFullYear()}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">{t.lunar}</p>
                    <p className="text-lg font-bold">
                      {selectedLunar?.day}/{selectedLunar?.month}/{selectedLunar?.year}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">{t.zodiacSign}</p>
                    <p className="text-lg font-bold text-red-600">{selectedZodiac}</p>
                  </div>

                  <button
                    onClick={() => toggleFavorite(selectedDate)}
                    className={`w-full py-2 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                      isFav
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <Heart size={18} className={isFav ? 'fill-white' : ''} />
                    {isFav ? t.removeFavorite : t.addFavorite}
                  </button>
                </div>
              ) : (
                <p className="text-gray-500">{t.selectDate}</p>
              )}
            </div>
          </div>
        )}

        {/* Zodiac Tab */}
        {activeTab === 'zodiac' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-2xl font-bold mb-4 text-red-700">{language === 'vi' ? '12 Cung Mệnh' : 'Zodiac Signs'}</h3>
              <div className="grid grid-cols-2 gap-4">
                {ZODIAC_SIGNS.map((sign, idx) => (
                  <div key={idx} className="border rounded p-4 hover:shadow-lg transition cursor-pointer">
                    <p className="font-bold text-red-600">{sign[language]}</p>
                    <p className="text-sm text-gray-600">{sign.dates}</p>
                    <p className="text-xs text-gray-500 mt-2">{sign.element}</p>
                  </div>
                ))}
              </div>
            </div>

            {selectedDate && selectedZodiacSign && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-2xl font-bold mb-4 text-red-700">{language === 'vi' ? 'Cung Mệnh Của Bạn' : 'Your Zodiac Sign'}</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">{language === 'vi' ? 'Ngày Sinh' : 'Birth Date'}</p>
                    <p className="text-lg font-bold">{selectedDate.getDate()}/{selectedDate.getMonth() + 1}/{selectedDate.getFullYear()}</p>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-xl font-bold text-red-600 mb-2">{selectedZodiacSign[language]}</p>
                    <div className="bg-red-50 p-4 rounded">
                      <p className="text-sm mb-2"><strong>{t.element}:</strong> {selectedZodiacSign.element}</p>
                      <p className="text-sm"><strong>{t.characteristic}:</strong> {selectedZodiacSign.characteristic}</p>
                    </div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded">
                    <p className="text-sm text-gray-700">
                      {language === 'vi'
                        ? `${selectedZodiacSign.vi} là cung mệnh với ${selectedZodiacSign.element}. Những người sinh dưới cung này thường có tính: ${selectedZodiacSign.characteristic}.`
                        : `${selectedZodiacSign.en} is a zodiac sign with ${selectedZodiacSign.element} element. People born under this sign typically have: ${selectedZodiacSign.characteristic}.`
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Feng Shui Tab */}
        {activeTab === 'fengshui' && selectedDate && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-2xl font-bold mb-4 text-red-700">{t.auspiciousHours}</h3>
              <div className="space-y-3">
                {Object.entries(AUSPICIOUS_HOURS).map(([idx, hour]) => (
                  <div 
                    key={idx}
                    className={`p-3 rounded border-l-4 ${
                      hour.auspicious 
                        ? 'bg-green-50 border-green-500' 
                        : 'bg-red-50 border-red-500'
                    }`}
                  >
                    <p className="font-semibold">{hour[language]}</p>
                    <p className="text-sm text-gray-600">
                      {hour.auspicious ? '🟢 ' + (language === 'vi' ? 'Hoàng Đạo' : 'Auspicious') : '🔴 ' + (language === 'vi' ? 'Hắc Đạo' : 'Inauspicious')}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-2xl font-bold mb-4 text-red-700">{t.fengShuiTips}</h3>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded">
                  <p className="font-semibold text-blue-700 mb-2">{t.goodDirections}</p>
                  <p className="text-sm">
                    {language === 'vi'
                      ? '🧭 Hướng Đông, Hướng Nam: Tốt cho hoạt động chính, khởi sự các dự án mới'
                      : '🧭 East, South: Good for major activities, starting new projects'
                    }
                  </p>
                </div>

                <div className="bg-amber-50 p-4 rounded">
                  <p className="font-semibold text-amber-700 mb-2">{t.badDirections}</p>
                  <p className="text-sm">
                    {language === 'vi'
                      ? '⚠️ Hướng Tây, Hướng Bắc: Nên tránh những hoạt động quan trọng'
                      : '⚠️ West, North: Avoid important activities'
                    }
                  </p>
                </div>

                <div className="bg-purple-50 p-4 rounded">
                  <p className="font-semibold text-purple-700 mb-2">💡 {language === 'vi' ? 'Lời Khuyên' : 'Recommendations'}</p>
                  <ul className="text-sm space-y-2">
                    <li>{language === 'vi' ? '✅ Tháng âm lịch lẻ: May mắn' : '✅ Odd lunar months: Lucky'}</li>
                    <li>{language === 'vi' ? '✅ Ngày con số lẻ: Cân bằng tốt' : '✅ Odd days: Good balance'}</li>
                    <li>{language === 'vi' ? '⏰ Sử dụng giờ hoàng đạo cho quyết định quan trọng' : '⏰ Use auspicious hours for important decisions'}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {!selectedDate && activeTab === 'fengshui' && (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg">{t.selectDate}</p>
          </div>
        )}
      </div>
    </div>
  );
}
