import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Settings, Users, Calendar, BarChart3, LogOut, Edit, Trash2, Plus, Search, Filter } from 'lucide-react';

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState({ name: 'Admin User', email: 'admin@lunar.com', role: 'Admin' });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [users, setUsers] = useState([
    { id: 1, name: 'Nguyễn Văn A', email: 'nguyena@example.com', joinDate: '2025-01-15', favorites: 12, status: 'Active' },
    { id: 2, name: 'Trần Thị B', email: 'tranb@example.com', joinDate: '2025-01-20', favorites: 8, status: 'Active' },
    { id: 3, name: 'Lê Văn C', email: 'levan@example.com', joinDate: '2025-01-10', favorites: 5, status: 'Inactive' },
  ]);
  
  const [holidays, setHolidays] = useState([
    { id: 1, name_vi: 'Tết Dương Lịch', name_en: 'New Year', date: '1-1', type: 'solar', active: true },
    { id: 2, name_vi: 'Tết Nguyên Đán', name_en: 'Lunar New Year', date: 'lunar-1-1', type: 'lunar', active: true },
    { id: 3, name_vi: 'Giỗ Tổ Hùng Vương', name_en: 'Hung Kings Festival', date: 'lunar-3-10', type: 'lunar', active: true },
    { id: 4, name_vi: 'Ngày Lao Động', name_en: 'Labor Day', date: '2-10', type: 'solar', active: true },
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [newHoliday, setNewHoliday] = useState({ name_vi: '', name_en: '', date: '', type: 'solar' });
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [language, setLanguage] = useState('vi');

  // Dashboard Stats
  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'Active').length,
    totalHolidays: holidays.length,
    totalFavorites: users.reduce((sum, u) => sum + u.favorites, 0)
  };

  // Chart data
  const userChartData = [
    { name: 'Tuần 1', users: 45 },
    { name: 'Tuần 2', users: 52 },
    { name: 'Tuần 3', users: 48 },
    { name: 'Tuần 4', users: 61 },
  ];

  const activityData = [
    { name: 'Tháng 1', visits: 400 },
    { name: 'Tháng 2', visits: 300 },
    { name: 'Tháng 3', visits: 200 },
    { name: 'Tháng 4', visits: 278 },
  ];

  const holidayTypes = [
    { name: 'Solar', value: holidays.filter(h => h.type === 'solar').length },
    { name: 'Lunar', value: holidays.filter(h => h.type === 'lunar').length }
  ];

  const COLORS = ['#ef4444', '#f59e0b'];

  // Handle holiday operations
  const handleAddHoliday = () => {
    if (newHoliday.name_vi && newHoliday.date) {
      const holiday = {
        id: Math.max(...holidays.map(h => h.id), 0) + 1,
        ...newHoliday,
        active: true
      };
      setHolidays([...holidays, holiday]);
      setNewHoliday({ name_vi: '', name_en: '', date: '', type: 'solar' });
    }
  };

  const handleDeleteHoliday = (id) => {
    setHolidays(holidays.filter(h => h.id !== id));
  };

  const handleUpdateHoliday = (id) => {
    setHolidays(holidays.map(h => h.id === id ? editingHoliday : h));
    setEditingHoliday(null);
  };

  const handleToggleHoliday = (id) => {
    setHolidays(holidays.map(h => 
      h.id === id ? { ...h, active: !h.active } : h
    ));
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const texts = {
    vi: {
      dashboard: 'Trang Chính',
      users: 'Quản Lý Người Dùng',
      holidays: 'Quản Lý Ngày Lễ',
      settings: 'Cài Đặt',
      logout: 'Đăng Xuất',
      hello: 'Xin Chào',
      totalUsers: 'Tổng Người Dùng',
      activeUsers: 'Người Dùng Hoạt Động',
      totalHolidays: 'Tổng Ngày Lễ',
      totalFavorites: 'Tổng Ngày Yêu Thích',
      userGrowth: 'Tăng Trưởng Người Dùng',
      activityChart: 'Biểu Đồ Hoạt Động',
      holidayDistribution: 'Phân Phối Ngày Lễ',
      name: 'Tên',
      email: 'Email',
      joinDate: 'Ngày Tham Gia',
      favorites: 'Yêu Thích',
      status: 'Trạng Thái',
      actions: 'Hành Động',
      search: 'Tìm Kiếm',
      edit: 'Sửa',
      delete: 'Xóa',
      add: 'Thêm',
      save: 'Lưu',
      cancel: 'Hủy',
      addHoliday: 'Thêm Ngày Lễ',
      vietnameseName: 'Tên Tiếng Việt',
      englishName: 'Tên Tiếng Anh',
      date: 'Ngày',
      type: 'Loại',
      solar: 'Dương Lịch',
      lunar: 'Âm Lịch',
      active: 'Hoạt Động',
      inactive: 'Không Hoạt Động',
      noData: 'Không Có Dữ Liệu',
      confirmDelete: 'Bạn Có Chắc Muốn Xóa?'
    },
    en: {
      dashboard: 'Dashboard',
      users: 'User Management',
      holidays: 'Holiday Management',
      settings: 'Settings',
      logout: 'Logout',
      hello: 'Hello',
      totalUsers: 'Total Users',
      activeUsers: 'Active Users',
      totalHolidays: 'Total Holidays',
      totalFavorites: 'Total Favorites',
      userGrowth: 'User Growth',
      activityChart: 'Activity Chart',
      holidayDistribution: 'Holiday Distribution',
      name: 'Name',
      email: 'Email',
      joinDate: 'Join Date',
      favorites: 'Favorites',
      status: 'Status',
      actions: 'Actions',
      search: 'Search',
      edit: 'Edit',
      delete: 'Delete',
      add: 'Add',
      save: 'Save',
      cancel: 'Cancel',
      addHoliday: 'Add Holiday',
      vietnameseName: 'Vietnamese Name',
      englishName: 'English Name',
      date: 'Date',
      type: 'Type',
      solar: 'Solar',
      lunar: 'Lunar',
      active: 'Active',
      inactive: 'Inactive',
      noData: 'No Data',
      confirmDelete: 'Are you sure?'
    }
  };

  const t = texts[language];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 w-64 h-screen bg-gray-800 border-r border-gray-700 p-6">
        <h1 className="text-2xl font-bold text-red-600 mb-8">🧧 Admin</h1>
        
        <nav className="space-y-3 mb-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'dashboard' ? 'bg-red-600' : 'hover:bg-gray-700'
            }`}
          >
            <BarChart3 size={20} />
            {t.dashboard}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'users' ? 'bg-red-600' : 'hover:bg-gray-700'
            }`}
          >
            <Users size={20} />
            {t.users}
          </button>
          <button
            onClick={() => setActiveTab('holidays')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'holidays' ? 'bg-red-600' : 'hover:bg-gray-700'
            }`}
          >
            <Calendar size={20} />
            {t.holidays}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              activeTab === 'settings' ? 'bg-red-600' : 'hover:bg-gray-700'
            }`}
          >
            <Settings size={20} />
            {t.settings}
          </button>
        </nav>

        <div className="border-t border-gray-700 pt-6">
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-1">{t.hello}, {currentUser.name}</p>
            <p className="text-xs text-gray-500">{currentUser.email}</p>
          </div>
          <button className="w-full flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition">
            <LogOut size={18} />
            {t.logout}
          </button>
        </div>

        {/* Language Toggle */}
        <div className="mt-6 flex gap-2">
          <button
            onClick={() => setLanguage('vi')}
            className={`flex-1 py-2 rounded text-sm font-semibold transition ${
              language === 'vi' ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            VN
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`flex-1 py-2 rounded text-sm font-semibold transition ${
              language === 'en' ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            EN
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div>
            <h1 className="text-4xl font-bold mb-8">{t.dashboard}</h1>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <p className="text-gray-400 text-sm mb-2">{t.totalUsers}</p>
                <p className="text-4xl font-bold text-red-600">{stats.totalUsers}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <p className="text-gray-400 text-sm mb-2">{t.activeUsers}</p>
                <p className="text-4xl font-bold text-green-600">{stats.activeUsers}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <p className="text-gray-400 text-sm mb-2">{t.totalHolidays}</p>
                <p className="text-4xl font-bold text-yellow-600">{stats.totalHolidays}</p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <p className="text-gray-400 text-sm mb-2">{t.totalFavorites}</p>
                <p className="text-4xl font-bold text-blue-600">{stats.totalFavorites}</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h2 className="text-xl font-bold mb-4">{t.userGrowth}</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={userChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="name" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                    <Bar dataKey="users" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h2 className="text-xl font-bold mb-4">{t.activityChart}</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                    <XAxis dataKey="name" stroke="#666" />
                    <YAxis stroke="#666" />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                    <Bar dataKey="visits" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h2 className="text-xl font-bold mb-4">{t.holidayDistribution}</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={holidayTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <h1 className="text-4xl font-bold mb-8">{t.users}</h1>
            
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <div className="mb-6 flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder={t.search}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100 placeholder-gray-400"
                  />
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition">
                  <Plus size={20} />
                  {t.add}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-600">
                    <tr>
                      <th className="text-left py-3 px-4 text-gray-300">{t.name}</th>
                      <th className="text-left py-3 px-4 text-gray-300">{t.email}</th>
                      <th className="text-left py-3 px-4 text-gray-300">{t.joinDate}</th>
                      <th className="text-left py-3 px-4 text-gray-300">{t.favorites}</th>
                      <th className="text-left py-3 px-4 text-gray-300">{t.status}</th>
                      <th className="text-left py-3 px-4 text-gray-300">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700 transition">
                        <td className="py-3 px-4">{user.name}</td>
                        <td className="py-3 px-4 text-gray-400">{user.email}</td>
                        <td className="py-3 px-4 text-gray-400">{user.joinDate}</td>
                        <td className="py-3 px-4">{user.favorites}</td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            user.status === 'Active' ? 'bg-green-900 text-green-200' : 'bg-gray-700 text-gray-300'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 flex gap-2">
                          <button className="p-2 hover:bg-gray-600 rounded transition">
                            <Edit size={18} />
                          </button>
                          <button className="p-2 hover:bg-red-900 rounded transition">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Holidays Tab */}
        {activeTab === 'holidays' && (
          <div>
            <h1 className="text-4xl font-bold mb-8">{t.holidays}</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Add Holiday Form */}
              <div className="lg:col-span-1 bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h2 className="text-xl font-bold mb-4">{t.addHoliday}</h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder={t.vietnameseName}
                    value={newHoliday.name_vi}
                    onChange={(e) => setNewHoliday({ ...newHoliday, name_vi: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100 placeholder-gray-400"
                  />
                  <input
                    type="text"
                    placeholder={t.englishName}
                    value={newHoliday.name_en}
                    onChange={(e) => setNewHoliday({ ...newHoliday, name_en: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100 placeholder-gray-400"
                  />
                  <input
                    type="text"
                    placeholder={t.date}
                    value={newHoliday.date}
                    onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100 placeholder-gray-400"
                  />
                  <select
                    value={newHoliday.type}
                    onChange={(e) => setNewHoliday({ ...newHoliday, type: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100"
                  >
                    <option value="solar">{t.solar}</option>
                    <option value="lunar">{t.lunar}</option>
                  </select>
                  <button
                    onClick={handleAddHoliday}
                    className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition font-semibold"
                  >
                    {t.add}
                  </button>
                </div>
              </div>

              {/* Holidays List */}
              <div className="lg:col-span-2 bg-gray-800 rounded-lg border border-gray-700 p-6">
                <h2 className="text-xl font-bold mb-4">{t.holidays}</h2>
                <div className="space-y-3">
                  {holidays.map(holiday => (
                    <div key={holiday.id} className="flex items-center justify-between p-4 bg-gray-700 rounded">
                      <div className="flex-1">
                        <h3 className="font-semibold">{holiday.name_vi}</h3>
                        <p className="text-sm text-gray-400">{holiday.name_en} • {holiday.date}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded ${
                          holiday.type === 'solar' ? 'bg-blue-900' : 'bg-red-900'
                        }`}>
                          {holiday.type === 'solar' ? t.solar : t.lunar}
                        </span>
                        <button
                          onClick={() => handleToggleHoliday(holiday.id)}
                          className={`px-2 py-1 rounded text-xs font-semibold transition ${
                            holiday.active ? 'bg-green-900 text-green-200' : 'bg-gray-600 text-gray-300'
                          }`}
                        >
                          {holiday.active ? t.active : t.inactive}
                        </button>
                        <button className="p-1 hover:bg-gray-600 rounded">
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteHoliday(holiday.id)}
                          className="p-1 hover:bg-red-900 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div>
            <h1 className="text-4xl font-bold mb-8">{t.settings}</h1>
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold mb-4">General Settings</h2>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Application Name</label>
                      <input type="text" defaultValue="Vietnamese Lunar Calendar" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Maintenance Mode</label>
                      <input type="checkbox" className="w-4 h-4" />
                    </div>
                  </div>
                </div>
                <div className="border-t border-gray-700 pt-6">
                  <h2 className="text-xl font-bold mb-4">Email Settings</h2>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">SMTP Server</label>
                      <input type="text" placeholder="smtp.gmail.com" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-gray-100" />
                    </div>
                  </div>
                </div>
                <button className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded font-semibold transition">Save Settings</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
