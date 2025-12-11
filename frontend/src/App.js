import React, { useEffect, useState } from 'react';
import LunarCalendarApp from './components/LunarCalendarApp';
import AdminDashboard from './components/AdminDashboard';
import { authService } from './services/authService';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      const user = JSON.parse(userData);
      setUser(user);
      setIsAdmin(user.role === 'admin');
    }
  }, []);

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <div>
      {isAdmin ? (
        <AdminDashboard user={user} onLogout={handleLogout} />
      ) : (
        <LunarCalendarApp user={user} setUser={setUser} setIsAdmin={setIsAdmin} />
      )}
    </div>
  );
}

export default App;