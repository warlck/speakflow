import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import Outliner from './components/Outliner';
import Drills from './components/Drills';
import Learn from './components/Learn';
import Lesson from './components/Lesson';
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
      {currentView === 'learn' && <Learn setCurrentView={setCurrentView} />}
      {currentView === 'lesson' && <Lesson setCurrentView={setCurrentView} />}
    </AppProvider>
  );
}

export default App;
