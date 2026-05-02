import React, { useState } from 'react';
import './Settings.css';
import { useAppContext } from '../context/AppContext';
import { Bell, Volume2, Moon, User, Key, ChevronRight, Flame } from 'lucide-react';

export default function Settings() {
  const { user, updateUserName, darkMode, setDarkMode, notificationsEnabled, togglePushNotif, logoutUser } = useAppContext();
  
  const [sound, setSound] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');

  const handleSaveName = async () => {
    if(newName.trim() !== '') {
      await updateUserName(newName.trim());
      setIsEditingName(false);
    }
  }

  if(!user) return null;

  return (
    <div className="settings-page animate-fade-in">
      <div className="page-header">
        <h1>Settings</h1>
      </div>

      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="profile-info">
            {isEditingName ? (
              <div style={{display:'flex', gap: 8, alignItems:'center'}}>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={e => setNewName(e.target.value)} 
                  autoFocus
                  style={{padding: '4px 8px', borderRadius: 4, border: '1px solid #ccc', fontSize: 16, width: '120px'}}
                />
                <button onClick={handleSaveName} style={{background: 'var(--primary)', color: 'white', padding: '4px 8px', borderRadius: 4, fontWeight: 'bold'}}>Save</button>
              </div>
            ) : (
              <h2 onClick={() => setIsEditingName(true)} style={{cursor: 'pointer'}} title="Click to edit name">
                {user.name} ✏️
              </h2>
            )}
            <p>{user.email}</p>
          </div>
        </div>
        
        <div className="level-badge">
          <div className="level-icon">L2</div>
          <div className="level-details">
            <span className="level-name">{user.level}</span>
            <span className="level-stats">⭐ {user.points} points • <Flame size={12} color="#e74c3c" style={{display:'inline'}}/> {user.streak} day streak</span>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Notifications</h3>
        <div className="settings-list">
          <div className="setting-item">
            <div className="setting-label">
              <span className="setting-icon">🔔</span> Push Notifications
            </div>
            <label className="toggle">
              <input type="checkbox" checked={notificationsEnabled} onChange={(e) => togglePushNotif(e.target.checked)} />
              <span className="slider"></span>
            </label>
          </div>
          <div className="setting-item">
            <div className="setting-label">
              <span className="setting-icon">🔊</span> Sound
            </div>
            <label className="toggle">
              <input type="checkbox" checked={sound} onChange={() => setSound(!sound)} />
              <span className="slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Appearance</h3>
        <div className="settings-list">
          <div className="setting-item">
            <div className="setting-label">
              <span className="setting-icon">🌙</span> Dark Mode
            </div>
            <label className="toggle">
              <input type="checkbox" checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
              <span className="slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Account</h3>
        <div className="settings-list">
          <div className="setting-item link">
            <div className="setting-label">
              <User size={20} color="var(--secondary)" className="lucide-icon" /> Edit Profile
            </div>
            <ChevronRight size={20} color="#999" />
          </div>
          <div className="setting-item link">
            <div className="setting-label">
              <Key size={20} color="#f39c12" className="lucide-icon" /> Change Password
            </div>
            <ChevronRight size={20} color="#999" />
          </div>
        </div>
      </div>
      
      <button 
        className="invite-btn" 
        style={{marginTop: 32, backgroundColor: '#e74c3c'}}
        onClick={logoutUser}
      >
        <span>Sign Out</span>
      </button>

    </div>
  );
}
