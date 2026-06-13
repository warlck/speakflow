import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import Outliner from './components/Outliner';
import Drills from './components/Drills';
import { AppProvider } from './context/AppContext';
import './index.css';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <AppProvider>
      {currentView === 'dashboard' && <Dashboard setCurrentView={setCurrentView} />}
      {currentView === 'outliner' && <Outliner setCurrentView={setCurrentView} />}
      {currentView === 'drills' && <Drills setCurrentView={setCurrentView} />}
    </AppProvider>
  );
}

export default App;
