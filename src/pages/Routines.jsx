import React, { useState } from 'react';
import './Routines.css';
import { useAppContext } from '../context/AppContext';
import TaskCard from '../components/TaskCard';
import { ClipboardList, Pill, Activity, Droplet, Plus, X, Sun, Moon } from 'lucide-react';

export default function Routines() {
  const context = useAppContext() || {};
  const { tasks = [], toggleTask = () => {}, addTask = () => {}, user } = context;
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const [filter, setFilter] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    time: '',
    category: 'Medicine',
    description: '',
    reminderEnabled: false,
    reminderType: 'none',
    reminderTime: '',
    accountabilityEnabled: false,
    selectedFamilyMemberId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  console.log('Routines component - user:', user);
  console.log('Routines component - tasks:', tasks);
  console.log('Routines component - safeTasks:', safeTasks);
  
  // Check if user is available
  if (!user) {
    return (
      <div className="routines-page animate-fade-in">
        <div className="page-header">
          <h1>Please log in to manage routines</h1>
        </div>
      </div>
    );
  }

  const categories = [
    { id: 'All', icon: <ClipboardList size={16} /> },
    { id: 'Medicine', icon: <Pill size={16} color="var(--accent-red)" /> },
    { id: 'Exercise', icon: <Activity size={16} color="var(--accent-blue)" /> },
    { id: 'Water', icon: <Droplet size={16} color="var(--accent-cyan)" /> }
  ];

  const suggestedRoutines = [
    { title: "Morning Hydration", time: "07:00", category: "Water", description: "Drink a large glass of water to start the day." },
    { title: "Daily Vitamins", time: "08:00", category: "Medicine", description: "Take vitamin D and multivitamins." },
    { title: "Evening Walk", time: "18:30", category: "Exercise", description: "30-minute brisk walk." },
  ];

  const filteredTasks = filter === 'All' ? safeTasks : safeTasks.filter(t => t.category === filter);

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim() || !newTask.time.trim()) {
      alert('Please fill in both title and time');
      return;
    }

    if (!addTask) {
      alert('Task service is unavailable. Please refresh the page.');
      return;
    }

    setIsSubmitting(true);
    const success = await addTask({
      ...newTask,
      title: newTask.title.trim(),
      time: newTask.time.trim()
    });
    setIsSubmitting(false);

    if (success) {
      setShowAddModal(false);
      setNewTask({ 
        title: '', 
        time: '', 
        category: 'Medicine', 
        description: '',
        reminderEnabled: false,
        reminderType: 'none',
        reminderTime: '',
        accountabilityEnabled: false,
        selectedFamilyMemberId: ''
      });
    } else {
      alert('Unable to add the task. Please try again.');
    }
  };

  return (
    <div className="routines-page animate-fade-in">
      <div className="page-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <h1>My Routines</h1>
          <p>{safeTasks.length} active routines</p>
        </div>
        <button 
          type="button"
          onClick={() => setShowAddModal(true)}
          style={{
            background: 'white', 
            color: 'var(--primary)', 
            border: 'none', 
            padding: '8px 16px', 
            borderRadius: '20px', 
            fontWeight: 'bold', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <Plus size={18} /> New
        </button>
      </div>

      <div className="filter-scroll">
        <div className="category-chips">
          {categories.map(cat => (
            <button 
              key={cat.id} 
              className={`chip ${filter === cat.id ? 'active' : ''}`}
              onClick={() => setFilter(cat.id)}
            >
              {cat.icon}
              <span>{cat.id}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="task-container">
        {filteredTasks.length > 0 ? (
          filteredTasks.map(task => (
            <TaskCard key={task.id} task={task} onToggle={toggleTask} />
          ))
        ) : (
          <div style={{textAlign: 'center', padding: '40px 20px', color: '#666'}}>
            <p>You don't have any routines for this category yet.</p>
          </div>
        )}

        {/* Suggested routines section when everything is empty */}
        {tasks.length === 0 && filter === 'All' && (
          <div style={{marginTop: '24px'}}>
             <h3 style={{marginBottom: '16px', fontSize: '18px', color: 'var(--text-main)'}}>Suggested for you</h3>
             {suggestedRoutines.map((suggestion, idx) => (
                <div key={idx} style={{
                  background: 'white', 
                  borderRadius: '12px', 
                  padding: '16px', 
                  marginBottom: '12px', 
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <h4 style={{margin: '0 0 4px', fontSize: '16px'}}>{suggestion.title}</h4>
                    <p style={{margin: '0', fontSize: '13px', color: 'var(--text-muted)'}}>{suggestion.time} • {suggestion.category}</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => addTask(suggestion)}
                    style={{
                      background: 'rgba(39, 174, 96, 0.1)',
                      color: 'var(--primary)',
                      border: 'none',
                      padding: '8px',
                      borderRadius: '8px',
                    }}
                  >
                    <Plus size={20} />
                  </button>
                </div>
             ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay animate-fade-in" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          {console.log('Modal is showing')}
          <div className="modal-content animate-slide-up" style={{background: 'white', borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '90%', maxHeight: '80vh', overflow: 'auto'}}>
            <div className="modal-header">
              <h3>Add New Routine</h3>
              <button type="button" onClick={() => setShowAddModal(false)}><X size={24} color="#666" /></button>
            </div>
            <form onSubmit={handleAddTask} className="add-task-form">
              <input 
                type="text" 
                placeholder="Task Title" 
                value={newTask.title}
                onChange={e => setNewTask({...newTask, title: e.target.value})}
                required
                className="form-input"
              />
              <input 
                type="time" 
                value={newTask.time}
                onChange={e => setNewTask({...newTask, time: e.target.value})}
                required
                className="form-input"
              />
              <select 
                value={newTask.category}
                onChange={e => setNewTask({...newTask, category: e.target.value})}
                className="form-input"
              >
                <option value="Medicine">Medicine</option>
                <option value="Exercise">Exercise</option>
                <option value="Water">Water</option>
                <option value="Sleep">Sleep</option>
                <option value="Meals">Meals</option>
              </select>
              <textarea 
                placeholder="Description" 
                value={newTask.description}
                onChange={e => setNewTask({...newTask, description: e.target.value})}
                className="form-input"
              />

              <div className="form-section">
                <h4>Reminders</h4>
                <div className="form-row">
                  <label className="checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={newTask.reminderEnabled}
                      onChange={e => setNewTask({...newTask, reminderEnabled: e.target.checked})}
                    />
                    <span>Enable Reminder</span>
                  </label>
                </div>
                {newTask.reminderEnabled && (
                  <div className="form-row">
                    <select 
                      value={newTask.reminderType}
                      onChange={e => setNewTask({...newTask, reminderType: e.target.value})}
                      className="form-input"
                    >
                      <option value="none">Select Type</option>
                      <option value="one-time">One-time</option>
                      <option value="daily">Daily Repeating</option>
                    </select>
                    <input 
                      type="time" 
                      value={newTask.reminderTime}
                      onChange={e => setNewTask({...newTask, reminderTime: e.target.value})}
                      required={newTask.reminderEnabled}
                      className="form-input"
                    />
                  </div>
                )}
              </div>

              <div className="form-section">
                <h4>Family Accountability</h4>
                <div className="form-row">
                  <label className="checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={newTask.accountabilityEnabled}
                      onChange={e => setNewTask({...newTask, accountabilityEnabled: e.target.checked})}
                    />
                    <span>Enable Accountability</span>
                  </label>
                </div>
                {newTask.accountabilityEnabled && (
                  <select 
                    value={newTask.selectedFamilyMemberId}
                    onChange={e => setNewTask({...newTask, selectedFamilyMemberId: e.target.value})}
                    className="form-input"
                    required={newTask.accountabilityEnabled}
                  >
                    <option value="">Select Family Member</option>
                    {context.family.map(member => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <button type="submit" className="btn-primary" style={{marginTop: '16px'}} disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Task'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
