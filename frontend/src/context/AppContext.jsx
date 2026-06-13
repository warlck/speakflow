import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [sessionHistory, setSessionHistory] = useState([]);
  const [activeOutline, setActiveOutline] = useState(null);

  const addSession = (session) => {
    setSessionHistory([...sessionHistory, session]);
  };

  return (
    <AppContext.Provider value={{ sessionHistory, addSession, activeOutline, setActiveOutline }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
