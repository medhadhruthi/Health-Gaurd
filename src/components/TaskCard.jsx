import React from 'react';
import './TaskCard.css';
import { Pill, Activity, Droplet, Moon, Utensils, Award } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function TaskCard({ task, onToggle }) {
  const getIcon = (category) => {
    switch(category) {
      case 'Medicine': return <Pill size={20} color="white" />;
      case 'Exercise': return <Activity size={20} color="white" />;
      case 'Water': return <Droplet size={20} color="white" />;
      case 'Sleep': return <Moon size={20} color="white" />;
      case 'Meals': return <Utensils size={20} color="white" />;
      default: return <Award size={20} color="white" />;
    }
  };

  const getBorderColor = (category) => {
    switch(category) {
      case 'Medicine': return 'var(--accent-red)';
      case 'Exercise': return 'var(--accent-blue)';
      case 'Water': return 'var(--accent-cyan)';
      case 'Sleep': return 'var(--accent-purple)';
      case 'Meals': return 'var(--accent-orange)';
      default: return 'var(--primary)';
    }
  };

  return (
    <div className={`task-card ${task.completed ? 'completed' : ''}`} style={{ borderTop: `4px solid ${getBorderColor(task.category)}`}}>
       <div className="task-icon-container" style={{ backgroundColor: getBorderColor(task.category) }}>
        {getIcon(task.category)}
       </div>
       <div className="task-details">
         <h3>{task.title}</h3>
         <div className="task-meta">
           <span className="task-time">⏰ {task.time}</span>
           <span className="task-category" style={{ color: getBorderColor(task.category)}}>{task.category}</span>
         </div>
         <p>{task.description}</p>
       </div>
       <div className="task-action">
         <button className={`check-btn ${task.completed ? 'checked' : ''}`} onClick={() => onToggle(task.id)}>
         </button>
       </div>
    </div>
  );
}
