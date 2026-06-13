import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { ArrowLeft, Save } from 'lucide-react';
import glassStyles from '../styles/glass.module.css';

const Settings = ({ setCurrentView }) => {
  const { apiKey, saveApiKey } = useAppContext();
  const [localKey, setLocalKey] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveApiKey(localKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className={glassStyles.page}>
      <header style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem' }}>
        <button className={glassStyles.button} onClick={() => setCurrentView('dashboard')} style={{ marginRight: '1rem', padding: '8px' }}>
          <ArrowLeft size={20} />
        </button>
        <h1>Settings</h1>
      </header>

      <div className={glassStyles.container} style={{ maxWidth: '600px' }}>
        <h2>API Configuration</h2>
        <p style={{ opacity: 0.8, marginBottom: '1.5rem', marginTop: '0.5rem' }}>
          Configure your Gemini API key to enable the Elite Executive Communications Coach.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Gemini API Key</label>
            <input
              type="password"
              className={glassStyles.input}
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
              placeholder="AIzaSy..."
            />
          </div>

          <button className={glassStyles.button} onClick={handleSave} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Save size={16} /> Save Settings
          </button>

          {saved && <span style={{ color: '#4ecdc4' }}>Settings saved successfully!</span>}
        </div>
      </div>
    </div>
  );
};

export default Settings;
