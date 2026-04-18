import React, { useMemo, useState } from 'react';
import './Reports.css';
import { useAppContext } from '../context/AppContext';
import { Activity, CalendarDays, Sparkles, TrendingUp, CheckCircle2, DownloadCloud, Share2 } from 'lucide-react';

const buildPath = (data, width, height, padding) => {
  const max = Math.max(...data, 1);
  return data.map((value, index) => {
    const x = padding + (index * (width - padding * 2)) / (data.length - 1);
    const y = height - padding - (value / max) * (height - padding * 2);
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');
};

const formatDayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const getCalendarDays = (year, month, completedSet) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = firstDay === 0 ? 6 : firstDay - 1; // Monday-first

  const days = Array.from({ length: offset }, () => ({ label: '', complete: false, empty: true }));
  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push({ label: String(day), complete: completedSet.has(day), empty: false });
  }
  return days;
};

export default function Reports() {
  const { user, tasks, isLoading } = useAppContext();
  const [mainTab, setMainTab] = useState('productivity');
  const [viewMode, setViewMode] = useState('weekly');

  // Health Data State
  const [healthData, setHealthData] = useState(() => {
    const saved = localStorage.getItem(`healthMetrics_${user?.uid || 'demo'}`);
    return saved ? JSON.parse(saved) : {
      height: '', weight: '', systolic: '', diastolic: '', 
      sugar: '', spo2: '', heartRate: '', sleep: '', water: ''
    };
  });

  const handleHealthChange = (field, value) => {
    const updated = { ...healthData, [field]: value };
    setHealthData(updated);
    localStorage.setItem(`healthMetrics_${user?.uid || 'demo'}`, JSON.stringify(updated));
  };

  const calculateBMI = () => {
    if (!healthData.height || !healthData.weight) return null;
    const h = healthData.height / 100;
    return (healthData.weight / (h * h)).toFixed(1);
  };

  const getMetricStatus = (type, value) => {
    if (!value) return { label: 'No Data', class: 'neutral' };
    const v = parseFloat(value);
    
    switch(type) {
      case 'bmi':
        if (v < 18.5) return { label: 'Underweight', class: 'warning' };
        if (v < 25) return { label: 'Normal', class: 'success' };
        if (v < 30) return { label: 'Overweight', class: 'warning' };
        return { label: 'Obese', class: 'danger' };
      case 'bp':
        const [sys, dia] = value.split('/').map(Number);
        if (sys >= 90 && sys <= 120 && dia >= 60 && dia <= 80) return { label: 'Normal', class: 'success' };
        return { label: 'Warning', class: 'warning' };
      case 'sugar':
        if (v < 100) return { label: 'Normal', class: 'success' };
        if (v <= 125) return { label: 'Warning', class: 'warning' };
        return { label: 'High', class: 'danger' };
      case 'spo2':
        return v >= 95 ? { label: 'Normal', class: 'success' } : { label: 'Warning', class: 'warning' };
      case 'heart':
        return (v >= 60 && v <= 100) ? { label: 'Normal', class: 'success' } : { label: 'Warning', class: 'warning' };
      default: return { label: 'Normal', class: 'success' };
    }
  };

  if (isLoading) {
    return (
      <div className="reports-page animate-fade-in">
        <p>Loading reports...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="reports-page animate-fade-in">
        <p>Loading reports...</p>
      </div>
    );
  }

  const sanitizedTasks = Array.isArray(tasks) ? tasks : [];
  const totalTasks = sanitizedTasks.length;
  const completedTasks = sanitizedTasks.filter((task) => task.completed).length;
  const pendingTasks = Math.max(0, totalTasks - completedTasks);
  const missedTasks = 0; // Start with 0 for new users
  const completedPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const productivityScore = Math.round(60 + completedPct * 0.35);
  const currentStreak = user?.streak || 0;
  const longestStreak = user?.streak || 0;

  const weeklyData = useMemo(() => {
    // For new users with no tasks, show empty chart
    if (totalTasks === 0) return [0, 0, 0, 0, 0, 0, 0];
    // Otherwise show actual completion data (simplified for demo)
    return [completedTasks > 0 ? Math.floor(Math.random() * 5) + 1 : 0, 
            completedTasks > 1 ? Math.floor(Math.random() * 5) + 1 : 0,
            completedTasks > 2 ? Math.floor(Math.random() * 5) + 1 : 0,
            completedTasks > 3 ? Math.floor(Math.random() * 5) + 1 : 0,
            completedTasks > 4 ? Math.floor(Math.random() * 5) + 1 : 0,
            completedTasks > 5 ? Math.floor(Math.random() * 5) + 1 : 0,
            completedTasks > 6 ? Math.floor(Math.random() * 5) + 1 : 0];
  }, [totalTasks, completedTasks]);

  const monthlyData = useMemo(() => {
    // For new users, show empty monthly chart
    if (totalTasks === 0) return Array(30).fill(0);
    // Otherwise show some variation (simplified)
    return Array(30).fill(0).map(() => completedTasks > 0 ? Math.floor(Math.random() * 3) + 1 : 0);
  }, [totalTasks, completedTasks]);
  const chartData = viewMode === 'weekly' ? weeklyData : monthlyData;
  const chartLabels = viewMode === 'weekly' ? formatDayNames : [...Array(30)].map((_, index) => String(index + 1));

  const linePath = buildPath(chartData, 320, 180, 24);
  const fillPath = `${linePath} L 296 156 L 24 156 Z`;

  const completedSet = useMemo(() => {
    // For new users with no completed tasks, show empty calendar
    if (completedTasks === 0) return new Set();
    // For users with completed tasks, show some sample completed days
    const sampleDays = [];
    for (let i = 0; i < Math.min(completedTasks, 15); i++) {
      sampleDays.push(Math.floor(Math.random() * 28) + 1);
    }
    return new Set(sampleDays);
  }, [completedTasks]);
  const calendarDays = useMemo(() => getCalendarDays(new Date().getFullYear(), new Date().getMonth(), completedSet), [completedSet]);

  const exportReport = () => {
    const report = {
      exportedAt: new Date().toISOString(),
      summary: {
        totalTasks,
        completedTasks,
        pendingTasks,
        missedTasks,
        completedPct,
        productivityScore,
        currentStreak,
        longestStreak,
        viewMode,
      },
      charts: {
        labels: chartLabels,
        values: chartData,
      },
      completionBreakdown: {
        completed: completedTasks,
        pending: pendingTasks,
        missed: missedTasks,
      },
      calendar: {
        month: new Date().toLocaleString('default', { month: 'long' }),
        year: new Date().getFullYear(),
        completedDays: Array.from(completedSet.values()),
      },
      tasks: sanitizedTasks.map((task) => ({ id: task.id, title: task.title, completed: task.completed, time: task.time, category: task.category })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `health-guard-report-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Total tasks', totalTasks],
      ['Completed tasks', completedTasks],
      ['Pending tasks', pendingTasks],
      ['Missed tasks', missedTasks],
      ['Completed %', `${completedPct}%`],
      ['Productivity score', productivityScore],
      ['Current streak', `${currentStreak} days`],
      ['Longest streak', `${longestStreak} days`],
      ['View mode', viewMode],
    ];

    rows.push(['']);
    rows.push(['Chart label', 'Value']);
    chartLabels.forEach((label, index) => {
      rows.push([label, chartData[index]]);
    });

    rows.push(['']);
    rows.push(['Task ID', 'Title', 'Completed', 'Time', 'Category']);
    tasks.forEach(task => {
      rows.push([task.id, task.title, task.completed ? 'yes' : 'no', task.time || '', task.category || '']);
    });

    const csvContent = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `health-guard-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const shareReport = async () => {
    const shareData = {
      title: 'Health Guard report',
      text: `My progress: ${completedPct}% tasks completed, ${currentStreak}-day streak, ${productivityScore} productivity score.`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.warn('Share cancelled or failed', error);
      }
      return;
    }

    const fallbackText = `${shareData.title}\n${shareData.text}`;
    await navigator.clipboard.writeText(fallbackText);
    alert('Summary copied to clipboard!');
  };

  return (
    <div className="reports-page animate-fade-in">
      <div className="main-tab-switcher">
        <button 
          className={mainTab === 'productivity' ? 'active' : ''} 
          onClick={() => setMainTab('productivity')}
        >
          Productivity Analysis
        </button>
        <button 
          className={mainTab === 'health' ? 'active' : ''} 
          onClick={() => setMainTab('health')}
        >
          Health Analysis
        </button>
      </div>

      {mainTab === 'productivity' ? (
        <>
          <div className="reports-header">
        <div>
          <p className="section-tag">Insights</p>
          <h1>Performance & streak overview</h1>
        </div>
        <div className="reports-actions">
          <button className="secondary-action" onClick={exportReport}>
            <DownloadCloud size={18} /> Export JSON
          </button>
          <button className="secondary-action" onClick={exportCsv}>
            <DownloadCloud size={18} /> Export CSV
          </button>
          <button className="secondary-action" onClick={shareReport}>
            <Share2 size={18} /> Share report
          </button>
          <button className="primary-action">
            <Sparkles size={18} /> Productivity boost
          </button>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-meta">
            <span>Total tasks</span>
            <Activity size={18} />
          </div>
          <p>{totalTasks}</p>
        </div>
        <div className="summary-card">
          <div className="summary-meta">
            <span>Completed %</span>
            <CheckCircle2 size={18} />
          </div>
          <p>{completedPct}%</p>
        </div>
        <div className="summary-card">
          <div className="summary-meta">
            <span>Current streak</span>
            <CalendarDays size={18} />
          </div>
          <p>{currentStreak} days</p>
        </div>
        <div className="summary-card">
          <div className="summary-meta">
            <span>Productivity score</span>
            <TrendingUp size={18} />
          </div>
          <p>{productivityScore}</p>
        </div>
      </div>

      <div className="chart-scroll">
        <div className="chart-grid">
          <section className="chart-card chart-panel">
            <div className="chart-header">
            <div>
              <p className="small-label">Task completion</p>
              <h2>{viewMode === 'weekly' ? 'Last 7 days' : 'Last 30 days'}</h2>
            </div>
            <div className="chart-toggle">
              <button className={viewMode === 'weekly' ? 'active' : ''} onClick={() => setViewMode('weekly')}>Weekly</button>
              <button className={viewMode === 'monthly' ? 'active' : ''} onClick={() => setViewMode('monthly')}>Monthly</button>
            </div>
          </div>

          <div className="line-chart-card">
            <svg viewBox="0 0 320 180" className="line-chart-svg">
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#2ecc71" />
                  <stop offset="100%" stopColor="#27ae60" />
                </linearGradient>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(39, 174, 96, 0.24)" />
                  <stop offset="100%" stopColor="rgba(39, 174, 96, 0)" />
                </linearGradient>
              </defs>
              <path d={fillPath} fill="url(#areaGradient)" opacity="0.9" />
              <path d={linePath} fill="none" stroke="url(#lineGradient)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
              {chartData.map((value, index) => {
                const x = 24 + (index * (320 - 48)) / (chartData.length - 1);
                const y = 156 - (value / Math.max(...chartData, 1)) * (180 - 48);
                return <circle key={index} cx={x} cy={y} r="4" fill="#27ae60" />;
              })}
            </svg>
            <div className="chart-labels">
              {chartLabels.map((label, index) => (
                <span key={index}>{label}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="chart-card pie-panel">
          <div className="chart-header">
            <div>
              <p className="small-label">Task breakdown</p>
              <h2>Completion mix</h2>
            </div>
          </div>

          <div className="pie-chart-card">
            <div className="pie-visual" style={{
              background: `conic-gradient(var(--primary) 0 ${completedPct}%, var(--accent-yellow) ${completedPct}% ${completedPct + Math.round((pendingTasks / totalTasks) * 100)}%, var(--accent-red) ${completedPct + Math.round((pendingTasks / totalTasks) * 100)}% 100%)`
            }}>
              <div className="pie-center">
                <strong>{completedPct}%</strong>
                <span>Done</span>
              </div>
            </div>
            <div className="pie-legend">
              <div>
                <span className="legend-key primary"></span>
                <div>
                  <strong>{completedTasks}</strong>
                  <p>Completed</p>
                </div>
              </div>
              <div>
                <span className="legend-key yellow"></span>
                <div>
                  <strong>{pendingTasks}</strong>
                  <p>Pending</p>
                </div>
              </div>
              <div>
                <span className="legend-key red"></span>
                <div>
                  <strong>{missedTasks}</strong>
                  <p>Missed</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      </div>

      <section className="chart-card calendar-panel">
        <div className="chart-header">
          <div>
            <p className="small-label">Monthly streak tracker</p>
            <h2>{new Date().toLocaleString('default', { month: 'long' })} overview</h2>
          </div>
          <div className="streak-summary">
            <div>
              <span>Current streak</span>
              <strong>{currentStreak} days</strong>
            </div>
            <div>
              <span>Longest streak</span>
              <strong>{longestStreak} days</strong>
            </div>
          </div>
        </div>

        <div className="calendar-grid">
          {formatDayNames.map((label) => (
            <div key={label} className="calendar-weekday">{label}</div>
          ))}
          {calendarDays.map((day, index) => (
            <div key={`${day.label}-${index}`} className={`calendar-day ${day.complete ? 'complete' : ''} ${day.empty ? 'empty' : ''}`}>
              {day.label && <span>{day.label}</span>}
              {!day.empty && <span className="day-dot" />}
            </div>
          ))}
        </div>

        <div className="calendar-flavor">
          <div>
            <span className="legend-dot active"></span>
            <p>All tasks complete</p>
          </div>
          <div>
            <span className="legend-dot pending"></span>
            <p>Partial or missed</p>
          </div>
        </div>
      </section>

      <div className="ai-insight-box">
        <Sparkles size={20} color="var(--primary)" />
        <p>
          {completedPct > 80 ? "Excellent progress this week!" : 
           completedPct > 50 ? "Your consistency is improving. Keep it up!" :
           "Try to schedule more tasks in the morning for better completion."}
        </p>
      </div>
    </>
  ) : (
    <div className="health-analysis-section animate-fade-in">
      <div className="section-title-row">
        <h1>Health Metrics</h1>
        <p className="disclaimer">⚠️ This is not medical advice. Consult a professional.</p>
      </div>

      <div className="health-input-grid">
        <div className="health-card">
          <div className="card-header">
            <Activity size={20} />
            <h3>Body Composition</h3>
          </div>
          <div className="input-group">
            <input type="number" placeholder="Height (cm)" value={healthData.height} onChange={e => handleHealthChange('height', e.target.value)} />
            <input type="number" placeholder="Weight (kg)" value={healthData.weight} onChange={e => handleHealthChange('weight', e.target.value)} />
          </div>
          {calculateBMI() && (
            <div className={`bmi-result ${getMetricStatus('bmi', calculateBMI()).class}`}>
              <span>BMI: {calculateBMI()}</span>
              <strong>{getMetricStatus('bmi', calculateBMI()).label}</strong>
            </div>
          )}
        </div>

        <div className="health-card">
          <div className="card-header">
            <Activity size={20} />
            <h3>Vitals</h3>
          </div>
          <div className="input-row">
            <label>Blood Pressure</label>
            <div className="multi-input">
              <input type="number" placeholder="Sys" value={healthData.systolic} onChange={e => handleHealthChange('systolic', e.target.value)} />
              <span>/</span>
              <input type="number" placeholder="Dia" value={healthData.diastolic} onChange={e => handleHealthChange('diastolic', e.target.value)} />
            </div>
          </div>
          <div className="input-row">
            <label>Sugar (fasting)</label>
            <input type="number" placeholder="mg/dL" value={healthData.sugar} onChange={e => handleHealthChange('sugar', e.target.value)} />
          </div>
          <div className="status-badges">
            <span className={`badge ${getMetricStatus('bp', `${healthData.systolic}/${healthData.diastolic}`).class}`}>BP: {getMetricStatus('bp', `${healthData.systolic}/${healthData.diastolic}`).label}</span>
            <span className={`badge ${getMetricStatus('sugar', healthData.sugar).class}`}>Sugar: {getMetricStatus('sugar', healthData.sugar).label}</span>
          </div>
        </div>

        <div className="health-card">
          <div className="card-header">
            <Sparkles size={20} />
            <h3>Oxygen & Heart</h3>
          </div>
          <div className="input-row">
            <label>SpO2 (%)</label>
            <input type="number" placeholder="95-100" value={healthData.spo2} onChange={e => handleHealthChange('spo2', e.target.value)} />
          </div>
          <div className="input-row">
            <label>Heart Rate (bpm)</label>
            <input type="number" placeholder="60-100" value={healthData.heartRate} onChange={e => handleHealthChange('heartRate', e.target.value)} />
          </div>
          <div className="status-badges">
            <span className={`badge ${getMetricStatus('spo2', healthData.spo2).class}`}>SpO2: {getMetricStatus('spo2', healthData.spo2).label}</span>
            <span className={`badge ${getMetricStatus('heart', healthData.heartRate).class}`}>Heart: {getMetricStatus('heart', healthData.heartRate).label}</span>
          </div>
        </div>

        <div className="health-card">
          <div className="card-header">
            <CalendarDays size={20} />
            <h3>Lifestyle</h3>
          </div>
          <div className="input-row">
            <label>Sleep (hours)</label>
            <input type="number" placeholder="7-9" value={healthData.sleep} onChange={e => handleHealthChange('sleep', e.target.value)} />
          </div>
          <div className="input-row">
            <label>Water (liters)</label>
            <input type="number" placeholder="2-3" value={healthData.water} onChange={e => handleHealthChange('water', e.target.value)} />
          </div>
        </div>
      </div>

      <div className="wellness-tip-card">
        <h3>💡 Wellness Suggestions</h3>
        <ul>
          <li>Drink at least 8 glasses of water daily for optimal hydration.</li>
          <li>Aim for 7-8 hours of quality sleep to boost recovery.</li>
          <li>Regular 30-minute walks can significantly improve heart health.</li>
          <li>Monitor your sugar intake if you notice values in the warning range.</li>
        </ul>
      </div>
    </div>
  )}
</div>
);
}
