import React, { useState, useEffect } from 'react';
import './App.css';
import { AppProvider, useAppContext } from './context/AppContext';
import Login from './pages/Login';
import Home from './pages/Home';
import Routines from './pages/Routines';
import Reports from './pages/Reports';
import Family from './pages/Family';
import Settings from './pages/Settings';
import BottomNav from './components/BottomNav';
import ErrorBoundary from './ErrorBoundary';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const { appAlert, setAppAlert, user, isLoading, completionPopup } = useAppContext();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setIsAuthenticated(!!firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Allow demo users to bypass Firebase authentication
  const isLoggedIn = isAuthenticated || (user && user.isDemo);

  // For demo users, skip the Firebase loading state
  if (loading && !user?.isDemo) return <div style={{display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center'}}>Loading...</div>;

  if (!isLoggedIn) {
    return <Login />;
  }

  // Show loading state while user data is being fetched (for real users)
  if (isLoading && !user?.isDemo) {
    return (
      <div style={{display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
        <div style={{width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite'}}></div>
        <p style={{marginTop: '16px', color: 'var(--text-muted)'}}>Loading your data...</p>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <Home />;
      case 'routines':
        return <Routines />;
      case 'reports':
        return <Reports />;
      case 'family':
        return <Family />;
      case 'settings':
        return <Settings />;
      default:
        return <Home />;
    }
  };

  return (
    <>
      <div className="app-content">
        {renderContent()}
      </div>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Motivational Completion Popup */}
      {completionPopup && (
        <div className="completion-popup animate-pop-in">
          <div className="completion-popup-content">
            <div className="completion-icon">🏆</div>
            <p>{completionPopup.message}</p>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {appAlert && (
        <div 
          onClick={() => setAppAlert(null)}
          className="app-alert animate-slide-up"
        >
          <h4>{appAlert.title}</h4>
          <p>{appAlert.message}</p>
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <AppProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </AppProvider>
  );
}

export default App;
