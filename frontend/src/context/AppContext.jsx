import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [sessionHistory, setSessionHistory] = useState([]);
  const [activeOutline, setActiveOutline] = useState(null);

  const saveApiKey = (key) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  const addSession = (session) => {
    setSessionHistory([...sessionHistory, session]);
  };

  return (
    <AppContext.Provider value={{ apiKey, saveApiKey, sessionHistory, addSession, activeOutline, setActiveOutline }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
