import React, { useState, useEffect } from 'react';
import AdminPanel from './components/AdminPanel';
import ManagerPanel from './components/ManagerPanel';

function App() {
  const [currentPage, setCurrentPage] = useState('manager');

  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/admin')) {
      setCurrentPage('admin');
    } else {
      setCurrentPage('manager');
    }
  }, []);

  return (
    <div>
      {currentPage === 'admin' ? <AdminPanel /> : <ManagerPanel />}
    </div>
  );
}

export default App;