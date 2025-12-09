import React from 'react';
import { Navigate } from 'react-router-dom';

function PrivateRoute({ children, isAdmin }) {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  if (isAdmin && JSON.parse(user).role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default PrivateRoute;