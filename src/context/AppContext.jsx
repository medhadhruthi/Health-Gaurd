import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, onSnapshot, doc, getDoc, setDoc, deleteDoc, updateDoc, addDoc, serverTimestamp, where, getDocs, orderBy } from 'firebase/firestore';
import { scheduleReminder, cancelReminder, rescheduleAllReminders } from '../utils/reminderUtils';

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [family, setFamily] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // App Settings
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [appAlert, setAppAlert] = useState(null); // internal toast alert
  const notifiedTasksRef = useRef(new Set()); // prevent duplicate notifications

  // ── NEW: motivational completion popup (Feature 1) ──────────────────────────
  const [completionPopup, setCompletionPopup] = useState(null);

  // ── NEW: accountability de-dup tracker (Feature 3) ───────────────────────
  const notifiedAccountabilityRef = useRef(new Set());

  const formatDateKey = (date) => date.toISOString().slice(0, 10);
  const previousDateKey = (dateKey) => {
    const date = new Date(dateKey);
    date.setDate(date.getDate() - 1);
    return date.toISOString().slice(0, 10);
  };

  const applyTaskRewards = async () => {
    if (!user) return;
    const todayKey = formatDateKey(new Date());
    const yesterdayKey = previousDateKey(todayKey);
    const previousKey = user.lastCompletedDate || null;
    const nextStreak = previousKey === todayKey
      ? user.streak || 1
      : previousKey === yesterdayKey
        ? (user.streak || 0) + 1
        : 1;

    const updatedUser = {
      ...user,
      points: (user.points || 0) + 10,
      streak: nextStreak,
      lastCompletedDate: todayKey,
    };
    
    // Update local state
    setUser(updatedUser);
    
    if (!user.isDemo) {
      // Save to Firestore for real users
      await updateDoc(doc(db, 'users', user.uid), {
        points: updatedUser.points,
        streak: updatedUser.streak,
        lastCompletedDate: updatedUser.lastCompletedDate
      });
    } else {
      // Save to localStorage for demo users
      localStorage.setItem('demoUser', JSON.stringify(updatedUser));
    }
  };

  // Handle Dark Mode
  useEffect(() => {
    if (darkMode) document.body.classList.add('dark-theme');
    else document.body.classList.remove('dark-theme');
  }, [darkMode]);

  // Handle Notifications Scheduler (existing task-time reminders)
  useEffect(() => {
    if (!notificationsEnabled || tasks.length === 0) return;
    
    const interval = setInterval(() => {
      const now = new Date();
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      const currentHHMM = `${h}:${m}`;
      
      tasks.forEach(task => {
        if (!task.completed && task.time === currentHHMM) {
          const taskKey = `${task.id}-${currentHHMM}`;
          if (!notifiedTasksRef.current.has(taskKey)) {
            // Trigger internal App Alert
            setAppAlert({ title: `Reminder: ${task.title}`, message: task.description || task.category });
            setTimeout(() => setAppAlert(null), 8000); // clear after 8 seconds

            // Try standard Browser Notification API fallback
            if (Notification.permission === 'granted') {
               new Notification(`Time for: ${task.title}`, { body: task.description || task.category });
            }
            
            notifiedTasksRef.current.add(taskKey);
          }
        }
      });
      
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [tasks, notificationsEnabled]);

  // ── NEW: Family Accountability Checker (Feature 3) ────────────────────────
  // Runs every 5 minutes; fires once per task (de-duplicated via Set)
  useEffect(() => {
    if (!user || tasks.length === 0 || family.length === 0) return;

    const checkAccountability = () => {
      const now = Date.now();
      tasks.forEach(task => {
        if (
          task.accountabilityEnabled &&
          !task.completed &&
          task.selectedFamilyMemberId
        ) {
          // Use task.time + today as the "due" reference, or fall back to task creation time
          // We flag tasks that have been open > 24h (86400000 ms) since their scheduled time
          let dueTimestamp = null;
          if (task.time) {
            const [h, m] = task.time.split(':').map(Number);
            const dueDate = new Date();
            dueDate.setHours(h, m, 0, 0);
            // If time is in the future, subtract a day (it was due yesterday)
            if (dueDate.getTime() > now) {
              dueDate.setDate(dueDate.getDate() - 1);
            }
            dueTimestamp = dueDate.getTime();
          }

          const overdueMs = dueTimestamp ? now - dueTimestamp : null;
          const is24hOverdue = overdueMs != null && overdueMs >= 24 * 60 * 60 * 1000;

          if (is24hOverdue) {
            const alertKey = `accountability-${task.id}`;
            if (!notifiedAccountabilityRef.current.has(alertKey)) {
              const member = family.find(f => f.id === task.selectedFamilyMemberId);
              const memberName = member ? member.name : 'your family member';
              const userName = user.name || 'User';

              // Show browser notification to logged-in user
              if (Notification.permission === 'granted') {
                new Notification(`👨‍👩‍👧 Accountability Alert`, {
                  body: `${userName} has not completed: "${task.title}" — ${memberName} has been notified.`,
                });
              }

              // Also set an in-app alert
              setAppAlert({
                title: '👨‍👩‍👧 Accountability Check',
                message: `${memberName} was notified: "${task.title}" is still incomplete.`,
              });
              setTimeout(() => setAppAlert(null), 8000);

              notifiedAccountabilityRef.current.add(alertKey);
            }
          }
        }
      });
    };

    // Run once immediately, then every 5 minutes
    checkAccountability();
    const accountabilityInterval = setInterval(checkAccountability, 5 * 60 * 1000);
    return () => clearInterval(accountabilityInterval);
  }, [tasks, family, user]);

  const togglePushNotif = async (val) => {
    if (val) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') setNotificationsEnabled(true);
      else setNotificationsEnabled(false);
    } else {
      setNotificationsEnabled(false);
    }
  };

  useEffect(() => {
    let unsubscribeTasks = () => {};
    let unsubscribeFamily = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setIsLoading(true);
        try {
          // Load user profile from Firestore
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnapshot = await getDoc(userDocRef);
          
          if (userDocSnapshot.exists()) {
            // User profile exists in Firestore, load it
            const userData = userDocSnapshot.data();
            setUser({
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || userData.name || 'Demo User',
              email: firebaseUser.email || firebaseUser.phoneNumber,
              level: userData.level || 'Starter',
              points: userData.points || 0,
              streak: userData.streak || 0,
              lastCompletedDate: userData.lastCompletedDate || null,
              createdAt: userData.createdAt || firebaseUser.metadata.creationTime
            });

            if (!userData.createdAt) {
              updateDoc(userDocRef, { createdAt: firebaseUser.metadata.creationTime });
            }
          } else {
            // First time user, create profile with defaults
            const newUserProfile = {
              name: firebaseUser.displayName || 'Demo User',
              email: firebaseUser.email || firebaseUser.phoneNumber,
              level: 'Starter',
              points: 0,
              streak: 0,
              lastCompletedDate: null,
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, newUserProfile);
            setUser({
              uid: firebaseUser.uid,
              ...newUserProfile
            });
          }

          // Listen for tasks
          const tasksQuery = query(collection(db, 'users', firebaseUser.uid, 'tasks'));
          unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
            const tasksData = [];
            snapshot.forEach(doc => tasksData.push({ id: doc.id, ...doc.data() }));
            setTasks(tasksData);
            // ── NEW: re-schedule reminders on data load (Feature 2) ──────────
            rescheduleAllReminders(tasksData, (taskId) => {
              const t = tasksData.find(x => x.id === taskId);
              return t ? !t.completed : false;
            });
            setIsLoading(false);
          });

          // Listen for family
          const familyQuery = query(collection(db, 'users', firebaseUser.uid, 'family'));
          unsubscribeFamily = onSnapshot(familyQuery, (snapshot) => {
            const familyData = [];
            snapshot.forEach(doc => familyData.push({ id: doc.id, ...doc.data() }));
            setFamily(familyData);
          });

        } catch (error) {
          console.error('Error loading user profile:', error);
          // Fallback: create a temporary user object so the app doesn't get stuck
          setUser({
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || 'Demo User',
            email: firebaseUser.email || 'user@example.com',
            level: 'Starter',
            points: 0,
            streak: 0,
            lastCompletedDate: null
          });
          setTasks([]);
          setFamily([]);
          setIsLoading(false);
        }
      } else {
        const savedDemoUser = JSON.parse(localStorage.getItem('demoUser') || 'null');
        const savedDemoTasks = JSON.parse(localStorage.getItem('demoTasks') || '[]');

        if (savedDemoUser && savedDemoUser.isDemo) {
          setUser(savedDemoUser);
          setTasks(savedDemoTasks);
          // ── NEW: re-schedule reminders for demo users too ──────────────────
          rescheduleAllReminders(savedDemoTasks, (taskId) => {
            const t = savedDemoTasks.find(x => x.id === taskId);
            return t ? !t.completed : false;
          });
        } else {
          setUser(null);
          setTasks([]);
          setFamily([]);
        }
        setIsLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeTasks();
      unsubscribeFamily();
    };
  }, []);

  const toggleTask = async (id) => {
    if(!user) return;
    const task = tasks.find(t => t.id === id);
    if(!task) return;

    const completed = !task.completed;
    if (completed) {
      await applyTaskRewards();

      // ── NEW: show motivational popup (Feature 1) ─────────────────────────
      setCompletionPopup({ message: '🎉 Congratulations! Task completed. +10 points' });
      setTimeout(() => setCompletionPopup(null), 2000);

      // Cancel any reminders for completed task (Feature 2)
      cancelReminder(id);
    }

    if (user.isDemo) {
      // For demo users, update localStorage
      const demoTasks = JSON.parse(localStorage.getItem('demoTasks') || '[]');
      const updatedTasks = demoTasks.map(t => 
        t.id === id ? { ...t, completed } : t
      );
      localStorage.setItem('demoTasks', JSON.stringify(updatedTasks));
      setTasks(updatedTasks);
    } else {
      // For real users, update Firestore
      await updateDoc(doc(db, 'users', user.uid, 'tasks', id), {
        completed
      });

      if (completed) {
        // Log completion
        await addDoc(collection(db, 'users', user.uid, 'completionLogs'), {
          taskId: id,
          taskTitle: task.title,
          category: task.category,
          timestamp: serverTimestamp()
        });
      } else {
        // Remove last log for this task today (if any)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const logsQuery = query(
          collection(db, 'users', user.uid, 'completionLogs'),
          where('taskId', '==', id),
          where('timestamp', '>=', startOfDay),
          orderBy('timestamp', 'desc')
        );
        const logSnap = await getDocs(logsQuery);
        if (!logSnap.empty) {
          await deleteDoc(doc(db, 'users', user.uid, 'completionLogs', logSnap.docs[0].id));
        }
      }
    }
  };

  const addTask = async (newTask) => {
    if(!user) {
      console.error('No user found, cannot add task');
      alert('Please log in to add tasks');
      return false;
    }

    if (user.isDemo) {
      // For demo users, store tasks in localStorage
      const demoTasks = JSON.parse(localStorage.getItem('demoTasks') || '[]');
      const taskWithId = { ...newTask, id: Date.now().toString(), completed: false };
      demoTasks.push(taskWithId);
      localStorage.setItem('demoTasks', JSON.stringify(demoTasks));
      setTasks(demoTasks);
      // ── NEW: schedule reminder if set (Feature 2) ──────────────────────────
      if (taskWithId.reminderEnabled && taskWithId.reminderType !== 'none') {
        scheduleReminder(taskWithId, () => {
          const current = JSON.parse(localStorage.getItem('demoTasks') || '[]');
          const t = current.find(x => x.id === taskWithId.id);
          return t ? !t.completed : false;
        });
      }
      return true;
    }

    // For real users, save to Firestore and update local state immediately
    try {
      const taskPayload = { ...newTask, completed: false };
      const docRef = await addDoc(collection(db, 'users', user.uid, 'tasks'), taskPayload);
      const newTaskWithId = { ...taskPayload, id: docRef.id };
      setTasks((prev) => {
        if (prev.some((task) => task.id === newTaskWithId.id)) return prev;
        return [...prev, newTaskWithId];
      });
      // ── NEW: schedule reminder if set (Feature 2) ──────────────────────────
      if (newTaskWithId.reminderEnabled && newTaskWithId.reminderType !== 'none') {
        scheduleReminder(newTaskWithId, () => {
          return !newTaskWithId.completed;
        });
      }
      return true;
    } catch (error) {
      console.error('Error adding task to Firestore:', error);
      return false;
    }
  };

  const deleteTask = async (id) => {
    if(!user) return;
    
    // ── NEW: cancel any reminder for deleted task (Feature 2) ─────────────
    cancelReminder(id);

    if (user.isDemo) {
      // For demo users, update localStorage
      const demoTasks = JSON.parse(localStorage.getItem('demoTasks') || '[]');
      const updatedTasks = demoTasks.filter(t => t.id !== id);
      localStorage.setItem('demoTasks', JSON.stringify(updatedTasks));
      setTasks(updatedTasks);
    } else {
      // For real users, delete from Firestore
      await deleteDoc(doc(db, 'users', user.uid, 'tasks', id));
    }
  };

  // ── NEW: Add Family Member (Feature 3) ─────────────────────────────────────
  const addFamilyMember = async (memberData) => {
    if (!user) return false;
    try {
      if (user.isDemo) {
        const demoFamily = JSON.parse(localStorage.getItem('demoFamily') || '[]');
        const memberWithId = { ...memberData, id: Date.now().toString() };
        demoFamily.push(memberWithId);
        localStorage.setItem('demoFamily', JSON.stringify(demoFamily));
        setFamily(demoFamily);
      } else {
        await addDoc(collection(db, 'users', user.uid, 'family'), memberData);
        // onSnapshot listener will update family state automatically
      }
      return true;
    } catch (error) {
      console.error('Error adding family member:', error);
      return false;
    }
  };
  
  const loginUser = (email) => {
    // Stub for the demo button on the login screen
    if(email === 'Demo User') {
      const savedDemoUser = JSON.parse(localStorage.getItem('demoUser') || 'null');
      const demoTasks = JSON.parse(localStorage.getItem('demoTasks') || '[]');
      const demoFamily = JSON.parse(localStorage.getItem('demoFamily') || '[]');

      const demoUser = savedDemoUser || {
        uid: 'demo-user-123',
        name: 'Demo User',
        email: 'demo@example.com',
        level: 'Starter',
        points: 0,
        streak: 0,
        lastCompletedDate: null,
        createdAt: new Date().toISOString(),
        isDemo: true
      };

      const initialTasks = demoTasks.length > 0 ? demoTasks : [
         { id: '1', title: 'Morning Vitamins', time: '08:00', category: 'Medicine', completed: false, description: 'Take daily vitamin supplements' }
      ];

      setUser(demoUser);
      setTasks(initialTasks);
      setFamily(demoFamily);
      localStorage.setItem('demoUser', JSON.stringify(demoUser));
      localStorage.setItem('demoTasks', JSON.stringify(initialTasks));
      
      // Demo users load instantly
      setIsLoading(false);
    }
  }

  const updateUserName = async (newName) => {
    if (!user) return;
    
    const updatedUser = { ...user, name: newName };
    setUser(updatedUser);
    
    if (!user.isDemo) {
      // For real users, update Firebase profile and Firestore
      const { updateProfile } = await import('firebase/auth');
      await updateProfile(auth.currentUser, { displayName: newName });
      await updateDoc(doc(db, 'users', user.uid), {
        name: newName
      });
    } else {
      // For demo users, save to localStorage
      localStorage.setItem('demoUser', JSON.stringify(updatedUser));
    }
  };

  const logoutUser = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
    localStorage.removeItem('demoUser');
    setUser(null);
    setTasks([]);
    setFamily([]);
  };

  return (
    <AppContext.Provider value={{ 
      user, 
      tasks, 
      family, 
      toggleTask, 
      addTask, 
      deleteTask,
      addFamilyMember,
      loginUser,
      logoutUser,
      updateUserName,
      darkMode, setDarkMode,
      notificationsEnabled, togglePushNotif,
      appAlert, setAppAlert,
      completionPopup,        // NEW – Feature 1
      isLoading
    }}>
      {children}
    </AppContext.Provider>
  );
};
