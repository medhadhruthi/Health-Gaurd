import React from 'react';
import './Home.css';
import { useAppContext } from '../context/AppContext';
import TaskCard from '../components/TaskCard';
import { Star, TrendingUp, Award, Flame } from 'lucide-react';

export default function Home() {
  const { user, tasks, toggleTask, isLoading } = useAppContext();
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="home-page animate-fade-in">
        <div className="dashboard-header">
          <div className="user-info">
            <p className="greeting">Loading...</p>
          </div>
        </div>
      </div>
    );
  }
  
  // Fallback in case user is null
  if (!user) {
    return (
      <div className="home-page animate-fade-in">
        <div className="dashboard-header">
          <div className="user-info">
            <p className="greeting">Welcome!</p>
          </div>
        </div>
      </div>
    );
  }
  
  const todayTasks = tasks.filter(t => !t.completed).slice(0,2); // Just for demo
  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="home-page animate-fade-in">
      <div className="dashboard-header">
        <div className="user-info">
          <div>
            <p className="greeting">Good Evening 👋</p>
            <h2>{user.name}</h2>
          </div>
          <div className="streak-badge">
            <Flame size={24} color="#f39c12" fill="#f39c12" />
            <span>{user.streak}</span>
          </div>
        </div>

        <div className="progress-section">
          <div className="progress-circle">
            <div className="circle-inner">
              <span className="percent">{progressPercent}%</span>
              <span className="label">Today</span>
            </div>
          </div>
          <div className="progress-text">
            <h3>Daily Progress</h3>
            <p>{completedCount} of {totalCount} tasks done</p>
            <div className="date-chip">
              📅 Apr 16, 2026
            </div>
          </div>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon yellow"><Star size={24} fill="#f1c40f" color="#f1c40f" /></div>
          <span className="stat-value">{user.points}</span>
          <span className="stat-label">Points</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><TrendingUp size={24} /></div>
          <span className="stat-value">0%</span>
          <span className="stat-label">Weekly</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><Award size={24} /></div>
          <span className="stat-value">2</span>
          <span className="stat-label">Level<br/>Starter</span>
        </div>
      </div>

      <div className="tasks-section">
        <div className="section-header">
          <h3>Today's Tasks</h3>
          <button className="view-all">View All</button>
        </div>
        <div className="task-list">
          {todayTasks.map(task => (
            <TaskCard key={task.id} task={task} onToggle={toggleTask} />
          ))}
        </div>
      </div>
    </div>
  );
}
