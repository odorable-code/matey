import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

function ProtectedRoute({ children, requiredRole = null }) {
  const { accessToken, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, var(--primary-blue-lighter) 0%, var(--primary-pink-lighter) 100%)',
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid var(--primary-blue)',
          borderTop: '4px solid var(--primary-pink)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
      </div>
    );
  }

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
