import React from 'react';
import { Home, ClipboardList, BarChart2, Users, Settings } from 'lucide-react';
import './BottomNav.css';

function BottomNav({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'home', icon: <Home size={24} />, label: 'Home' },
    { id: 'routines', icon: <ClipboardList size={24} />, label: 'Routines' },
    { id: 'reports', icon: <BarChart2 size={24} />, label: 'Reports' },
    { id: 'family', icon: <Users size={24} />, label: 'Family' },
    { id: 'settings', icon: <Settings size={24} />, label: 'Settings' }
  ];

  return (
    <div className="bottom-nav">
      {tabs.map(tab => (
        <button 
          key={tab.id}
          className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          {tab.icon}
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

export default BottomNav;
