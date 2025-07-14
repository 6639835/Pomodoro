import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings, 
  Volume2, 
  VolumeX, 
  Sun, 
  Moon,
  Timer,
  Coffee,
  CheckCircle,
  Clock,
  X,
  Plus,
  Minus,
  Save
} from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import toast, { Toaster } from 'react-hot-toast';

const TIMER_MODES = {
  WORK: 'work',
  SHORT_BREAK: 'short-break', 
  LONG_BREAK: 'long-break'
};

const DEFAULT_SETTINGS = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: true,
  autoStartWork: false,
  soundEnabled: true,
  darkMode: false
};

// Local storage utilities
const STORAGE_KEYS = {
  SETTINGS: 'pomodoro-settings',
  PROGRESS: 'pomodoro-progress',
  SESSION_STATE: 'pomodoro-session'
};

const loadFromStorage = (key, defaultValue) => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.warn(`Error loading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Error saving ${key} to localStorage:`, error);
  }
};

function App() {
  // Load persisted data on component mount
  const [settings, setSettings] = useState(() => 
    loadFromStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
  );
  
  const [currentMode, setCurrentMode] = useState(() => 
    loadFromStorage(STORAGE_KEYS.SESSION_STATE, { mode: TIMER_MODES.WORK }).mode
  );
  
  const [timeLeft, setTimeLeft] = useState(() => {
    const sessionState = loadFromStorage(STORAGE_KEYS.SESSION_STATE, {});
    const storedSettings = loadFromStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    return sessionState.timeLeft || storedSettings.workDuration * 60;
  });
  
  const [isRunning, setIsRunning] = useState(false);
  
  const [progressData, setProgressData] = useState(() => 
    loadFromStorage(STORAGE_KEYS.PROGRESS, {
      completedSessions: 0,
      totalSessions: 0,
      totalFocusTime: 0
    })
  );
  
  const [completedSessions, setCompletedSessions] = useState(progressData.completedSessions);
  const [totalSessions, setTotalSessions] = useState(progressData.totalSessions);
  const [totalFocusTime, setTotalFocusTime] = useState(progressData.totalFocusTime);
  const [showSettings, setShowSettings] = useState(false);
  
  // Remove separate darkMode state - use settings.darkMode directly
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);
  const [browserSupport, setBrowserSupport] = useState({
    webAudio: false,
    notifications: false
  });
  
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SETTINGS, settings);
  }, [settings]);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    const progressData = {
      completedSessions,
      totalSessions,
      totalFocusTime
    };
    setProgressData(progressData);
    saveToStorage(STORAGE_KEYS.PROGRESS, progressData);
  }, [completedSessions, totalSessions, totalFocusTime]);

  // Save session state to localStorage
  useEffect(() => {
    const sessionState = {
      mode: currentMode,
      timeLeft,
      timestamp: Date.now()
    };
    saveToStorage(STORAGE_KEYS.SESSION_STATE, sessionState);
  }, [currentMode, timeLeft]);

  // Restore session on page reload if it was recent (within 5 minutes)
  useEffect(() => {
    const sessionState = loadFromStorage(STORAGE_KEYS.SESSION_STATE, {});
    if (sessionState.timestamp) {
      const timeSinceLastSession = Date.now() - sessionState.timestamp;
      const fiveMinutes = 5 * 60 * 1000;
      
      if (timeSinceLastSession < fiveMinutes && sessionState.mode && sessionState.timeLeft > 0) {
        // Only restore if the session was recent and valid
        setCurrentMode(sessionState.mode);
        setTimeLeft(sessionState.timeLeft);
        
        toast.success('Session restored! Continue where you left off.', {
          icon: '🔄',
          duration: 4000
        });
      }
    }
  }, []); // Only run on mount

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't trigger shortcuts when user is typing in inputs or modals are open
      if (
        event.target.tagName === 'INPUT' || 
        event.target.tagName === 'TEXTAREA' ||
        showSettings ||
        event.target.closest('[data-modal-content]')
      ) {
        return;
      }

      // Prevent default behavior for our shortcuts
      const shortcutKeys = [' ', 'r', 's', 'd', 'm', '?', 'Escape'];
      if (shortcutKeys.includes(event.key)) {
        event.preventDefault();
      }

      switch (event.key) {
        case ' ': // Spacebar - Start/Pause
          if (isRunning) {
            pauseTimer();
            toast.success('Timer paused', { icon: '⏸️', duration: 2000 });
          } else {
            startTimer();
            toast.success('Timer started', { icon: '▶️', duration: 2000 });
          }
          break;
          
        case 'r': // R - Reset timer
          resetTimer();
          break;
          
        case 's': // S - Skip session
          skipSession();
          toast.success('Session skipped', { icon: '⏭️', duration: 2000 });
          break;
          
        case 'd': // D - Toggle dark mode
          setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }));
          toast.success(`${settings.darkMode ? 'Light' : 'Dark'} mode activated`, { 
            icon: settings.darkMode ? '☀️' : '🌙', 
            duration: 2000 
          });
          break;
          
        case 'm': // M - Toggle sound
          setSoundEnabled(!soundEnabled);
          setSettings(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }));
          toast.success(`Sound ${soundEnabled ? 'disabled' : 'enabled'}`, { 
            icon: soundEnabled ? '🔇' : '🔊', 
            duration: 2000 
          });
          break;
          
        case ',': // , - Open settings (like Slack)
        case 'Enter':
          if (event.ctrlKey || event.metaKey) {
            setShowSettings(true);
          }
          break;
          
        case 'Escape': // Escape - Close settings
          if (showSettings) {
            setShowSettings(false);
          }
          break;
          
        case '?': // ? - Show keyboard shortcuts help
          toast(
            <div className="text-sm">
              <div className="font-semibold mb-2">Keyboard Shortcuts:</div>
              <div className="space-y-1 text-xs">
                <div><strong>Space:</strong> Start/Pause timer</div>
                <div><strong>R:</strong> Reset timer</div>
                <div><strong>S:</strong> Skip session</div>
                <div><strong>D:</strong> Toggle dark mode</div>
                <div><strong>M:</strong> Toggle sound</div>
                <div><strong>Ctrl+Enter:</strong> Open settings</div>
                <div><strong>Esc:</strong> Close settings</div>
                <div><strong>?:</strong> Show this help</div>
              </div>
            </div>,
            { 
              duration: 8000,
              icon: '⌨️'
            }
          );
          break;
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Show keyboard shortcuts hint on first visit
    const hasSeenShortcuts = loadFromStorage('pomodoro-shortcuts-hint', false);
    if (!hasSeenShortcuts) {
      setTimeout(() => {
        toast('💡 Tip: Press "?" to see keyboard shortcuts!', { 
          duration: 6000,
          icon: '⌨️'
        });
        saveToStorage('pomodoro-shortcuts-hint', true);
      }, 3000);
    }

    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isRunning, showSettings, settings.darkMode, soundEnabled]); // Dependencies for the shortcuts

  // Check browser compatibility on mount
  useEffect(() => {
    const checkBrowserSupport = async () => {
      const support = {
        webAudio: !!(window.AudioContext || window.webkitAudioContext),
        notifications: 'Notification' in window
      };

      // Request notification permission if supported and sound is enabled
      if (support.notifications && soundEnabled) {
        try {
          if (Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            support.notifications = permission === 'granted';
          } else {
            support.notifications = Notification.permission === 'granted';
          }
        } catch (error) {
          console.warn('Notification permission request failed:', error);
          support.notifications = false;
        }
      }

      setBrowserSupport(support);
      
      // Show compatibility info in development
      if (process.env.NODE_ENV === 'development') {
        console.info('Browser support:', support);
      }
    };

    checkBrowserSupport();
  }, [soundEnabled]);

  // Initialize audio context once and reuse
  useEffect(() => {
    let audioContext = null;
    
    const initializeAudio = () => {
      try {
        // Only create if not already created and browser supports it
        if (!audioContext && (window.AudioContext || window.webkitAudioContext)) {
          audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioContext;
      } catch (error) {
        console.warn('Web Audio API not supported:', error);
        return null;
      }
    };
    
    const playNotificationSound = (frequency = 800, duration = 200) => {
      if (!soundEnabled) return;
      
      const context = initializeAudio();
      if (!context) {
        // Fallback for browsers without Web Audio API
        playFallbackNotificationSound();
        return;
      }
      
      // Resume context if suspended (required by some browsers)
      if (context.state === 'suspended') {
        context.resume().catch(error => {
          console.warn('Failed to resume audio context:', error);
          playFallbackNotificationSound();
        });
      }
      
      try {
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + duration / 1000);
        
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + duration / 1000);
      } catch (error) {
        console.warn('Error playing Web Audio notification:', error);
        playFallbackNotificationSound();
      }
    };

    // Fallback notification method for older browsers
    const playFallbackNotificationSound = () => {
      try {
        // Try using the HTML5 Audio API as fallback
        const audio = new Audio();
        audio.volume = 0.3;
        
        // Generate a simple beep using data URI
        const audioContext = new (window.AudioContext || window.webkitAudioContext || null)();
        if (audioContext) {
          // If we have AudioContext but it failed above, try a simpler approach
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          gainNode.gain.value = 0.1;
          
          oscillator.start();
          oscillator.stop(audioContext.currentTime + 0.2);
        } else {
          // Ultimate fallback - use browser notification API if available
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Pomodoro Timer', {
              body: 'Session completed!',
              icon: '/favicon.ico',
              silent: false
            });
          } else {
            // Last resort - visual feedback only
            console.info('🔔 Timer completed - audio not available');
          }
        }
      } catch (error) {
        console.warn('All audio methods failed:', error);
      }
    };
    
    audioRef.current = { playNotificationSound };
    
    // Cleanup function to properly close audio context
    return () => {
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(error => {
          console.warn('Error closing audio context:', error);
        });
      }
    };
  }, []); // Remove soundEnabled dependency to prevent recreation

  // Apply dark mode
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // Timer logic with race condition protection
  useEffect(() => {
    // Clear any existing interval first to prevent multiple intervals
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            // Clear interval immediately to prevent multiple calls
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            // Use setTimeout to avoid calling handleTimerComplete during render
            setTimeout(() => handleTimerComplete(), 0);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, timeLeft]);

  // Handle timer completion with race condition protection
  const handleTimerComplete = useCallback(() => {
    // Prevent multiple simultaneous calls
    if (!isRunning) return;
    
    setIsRunning(false);
    
    // Play notification sound
    if (soundEnabled && audioRef.current) {
      try {
        audioRef.current.playNotificationSound(800, 300);
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.playNotificationSound(1000, 300);
          }
        }, 400);
      } catch (error) {
        console.warn('Error playing notification sound:', error);
      }
    }

    if (currentMode === TIMER_MODES.WORK) {
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      setTotalSessions(prev => prev + 1);
      
      // Add completed work session time to total focus time
      setTotalFocusTime(prev => prev + settings.workDuration);
      
      // Determine next mode
      if (newCompletedSessions % settings.longBreakInterval === 0) {
        setCurrentMode(TIMER_MODES.LONG_BREAK);
        setTimeLeft(settings.longBreakDuration * 60);
        toast.success('Work session completed! Time for a long break.', {
          duration: 4000,
          icon: '🎉'
        });
      } else {
        setCurrentMode(TIMER_MODES.SHORT_BREAK);
        setTimeLeft(settings.shortBreakDuration * 60);
        toast.success('Work session completed! Take a short break.', {
          duration: 4000,
          icon: '☕'
        });
      }
      
      // Auto-start break if enabled
      if (settings.autoStartBreaks) {
        setTimeout(() => setIsRunning(true), 1000);
      }
    } else {
      setCurrentMode(TIMER_MODES.WORK);
      setTimeLeft(settings.workDuration * 60);
      toast.success('Break time is over! Ready to focus?', {
        duration: 4000,
        icon: '💪'
      });
      
      // Auto-start work if enabled
      if (settings.autoStartWork) {
        setTimeout(() => setIsRunning(true), 1000);
      }
    }
  }, [currentMode, completedSessions, totalSessions, settings, soundEnabled, isRunning]);

  // Control functions
  const startTimer = () => {
    setIsRunning(true);
  };

  const pauseTimer = () => {
    // Clear interval when pausing
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  };

  const resetTimer = () => {
    // Track partial focus time if we're resetting during a work session
    if (currentMode === TIMER_MODES.WORK && isRunning) {
      const timeSpent = settings.workDuration * 60 - timeLeft;
      const minutesSpent = Math.floor(timeSpent / 60);
      if (minutesSpent > 0) {
        setTotalFocusTime(prev => prev + minutesSpent);
      }
    }
    
    // Clear any running interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setIsRunning(false);
    setCurrentMode(TIMER_MODES.WORK);
    setTimeLeft(settings.workDuration * 60);
    toast.success('Timer reset!', { icon: '🔄' });
  };

  const skipSession = () => {
    setIsRunning(false);
    handleTimerComplete();
  };

  // Data management functions
  const resetAllData = () => {
    if (window.confirm('Are you sure you want to reset all data? This cannot be undone.')) {
      // Clear localStorage
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Reset state
      setSettings(DEFAULT_SETTINGS);
      setCurrentMode(TIMER_MODES.WORK);
      setTimeLeft(DEFAULT_SETTINGS.workDuration * 60);
      setIsRunning(false);
      setCompletedSessions(0);
      setTotalSessions(0);
      setTotalFocusTime(0);
      setSoundEnabled(DEFAULT_SETTINGS.soundEnabled);
      
      toast.success('All data has been reset!', { icon: '🗑️' });
    }
  };

  const exportData = () => {
    try {
      const data = {
        settings,
        progress: { completedSessions, totalSessions, totalFocusTime },
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `pomodoro-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully!', { icon: '📥' });
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data.');
    }
  };

  // Settings functions
  const updateSettings = (newSettings) => {
    const previousSettings = settings;
    setSettings(newSettings);
    
    // Handle timer duration changes more intelligently
    if (!isRunning) {
      // Timer is stopped - update to new duration
      switch (currentMode) {
        case TIMER_MODES.WORK:
          setTimeLeft(newSettings.workDuration * 60);
          break;
        case TIMER_MODES.SHORT_BREAK:
          setTimeLeft(newSettings.shortBreakDuration * 60);
          break;
        case TIMER_MODES.LONG_BREAK:
          setTimeLeft(newSettings.longBreakDuration * 60);
          break;
        default:
          break;
      }
    } else {
      // Timer is running - adjust proportionally if duration changed
      const getCurrentModeDuration = (settings, mode) => {
        switch (mode) {
          case TIMER_MODES.WORK: return settings.workDuration * 60;
          case TIMER_MODES.SHORT_BREAK: return settings.shortBreakDuration * 60;
          case TIMER_MODES.LONG_BREAK: return settings.longBreakDuration * 60;
          default: return settings.workDuration * 60;
        }
      };
      
      const oldDuration = getCurrentModeDuration(previousSettings, currentMode);
      const newDuration = getCurrentModeDuration(newSettings, currentMode);
      
      if (oldDuration !== newDuration) {
        // Calculate progress and apply to new duration
        const progress = (oldDuration - timeLeft) / oldDuration;
        const newTimeLeft = Math.max(1, Math.round(newDuration - (progress * newDuration)));
        setTimeLeft(newTimeLeft);
        
        // Show user feedback
        toast.success(`Timer duration updated! ${Math.ceil(newTimeLeft / 60)} minutes remaining.`, {
          icon: '⏱️',
          duration: 3000
        });
      }
    }
    
    setSoundEnabled(newSettings.soundEnabled);
  };

  // Helper functions
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    const totalTime = currentMode === TIMER_MODES.WORK 
      ? settings.workDuration * 60
      : currentMode === TIMER_MODES.SHORT_BREAK 
        ? settings.shortBreakDuration * 60
        : settings.longBreakDuration * 60;
    
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  const getModeConfig = () => {
    switch (currentMode) {
      case TIMER_MODES.WORK:
        return {
          title: 'Focus Time',
          color: '#f43f5e',
          icon: Timer,
          bgColor: 'from-primary-500 to-primary-600'
        };
      case TIMER_MODES.SHORT_BREAK:
        return {
          title: 'Short Break',
          color: '#22c55e',
          icon: Coffee,
          bgColor: 'from-success-500 to-success-600'
        };
      case TIMER_MODES.LONG_BREAK:
        return {
          title: 'Long Break',
          color: '#0ea5e9',
          icon: Coffee,
          bgColor: 'from-secondary-500 to-secondary-600'
        };
      default:
        return {
          title: 'Focus Time',
          color: '#f43f5e',
          icon: Timer,
          bgColor: 'from-primary-500 to-primary-600'
        };
    }
  };

  const modeConfig = getModeConfig();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-2xl"
      >
        {/* Enhanced Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <div className="flex items-center justify-center mb-4">
            <motion.div
              className="p-3 mr-4 bg-white/[0.12] rounded-2xl backdrop-blur-md border border-white/[0.2]"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <Timer className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="heading-primary">
              Pomodoro Timer
            </h1>
          </div>
          <p className="text-xl text-white/80 font-medium">
            Boost your productivity with focused work sessions
          </p>
        </motion.div>

        {/* Enhanced Main Timer Card */}
        <motion.div
          className="card-elevated p-10 text-center relative overflow-hidden mb-8"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          whileHover={{ scale: 1.01 }}
        >
          {/* Enhanced Background Animation */}
          <motion.div 
            className={`absolute inset-0 bg-gradient-to-br ${modeConfig.bgColor} opacity-10`}
            animate={{ 
              background: `linear-gradient(45deg, ${modeConfig.color}10, transparent, ${modeConfig.color}05)` 
            }}
          />
          
          {/* Enhanced Mode Header */}
          <motion.div 
            className="relative z-10 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center justify-center mb-3">
              <motion.div
                className="p-2 mr-3 rounded-xl backdrop-blur-sm"
                style={{ backgroundColor: `${modeConfig.color}20` }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <modeConfig.icon className="w-7 h-7" style={{ color: modeConfig.color }} />
              </motion.div>
              <h2 className="heading-secondary">
                {modeConfig.title}
              </h2>
            </div>
            <div className="inline-flex items-center px-4 py-2 bg-white/[0.08] backdrop-blur-md rounded-full border border-white/[0.15]">
              <span className="text-sm font-medium text-white/80">
                Session {completedSessions + 1} of {settings.longBreakInterval}
              </span>
            </div>
          </motion.div>

          {/* Enhanced Timer Display */}
          <motion.div 
            className="relative z-10 mb-10"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
          >
            <div className="w-80 h-80 mx-auto relative">
              <motion.div
                className={`timer-ring ${isRunning ? 'active' : ''}`}
                whileHover={{ scale: 1.02 }}
              >
                <CircularProgressbar
                  value={getProgress()}
                  text=""
                  styles={buildStyles({
                    rotation: -0.25,
                    strokeLinecap: 'round',
                    pathTransition: 'stroke-dashoffset 1s ease-in-out',
                    pathColor: modeConfig.color,
                    trailColor: settings.darkMode ? '#374151' : '#f1f5f9',
                    strokeWidth: 4,
                  })}
                />
              </motion.div>
              
              {/* Enhanced Timer Content */}
              <motion.div 
                className="absolute inset-0 flex items-center justify-center"
                animate={{ scale: isRunning ? [1, 1.02, 1] : 1 }}
                transition={{ duration: 2, repeat: isRunning ? Infinity : 0 }}
              >
                <div className="timer-content p-8 text-center">
                  <motion.div 
                    className="text-6xl sm:text-7xl font-mono font-bold text-white mb-2"
                    key={formatTime(timeLeft)}
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    aria-live="polite"
                    aria-label={`Timer: ${formatTime(timeLeft)} remaining`}
                    role="timer"
                  >
                    {formatTime(timeLeft)}
                  </motion.div>
                  <div 
                    className="text-sm font-medium text-white/70 uppercase tracking-wider"
                    aria-live="polite"
                    aria-label={`Current mode: ${modeConfig.title}`}
                  >
                    {currentMode === TIMER_MODES.WORK ? 'Focus Time' : 'Break Time'}
                  </div>
                </div>
              </motion.div>
              
              {/* Enhanced Pulse effect when running */}
              {isRunning && (
                <motion.div 
                  className="absolute inset-0 rounded-full"
                  style={{ 
                    background: `radial-gradient(circle, ${modeConfig.color}15 0%, transparent 70%)`,
                  }}
                  animate={{ 
                    scale: [1, 1.1, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{ 
                    duration: 2, 
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
            </div>
          </motion.div>

          {/* Enhanced Controls */}
          <motion.div 
            className="relative z-10 flex justify-center items-center space-x-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={isRunning ? pauseTimer : startTimer}
              className={`${isRunning ? 'btn-warning' : 'btn-primary'} flex items-center space-x-3 text-lg font-semibold min-w-[140px] focus-ring`}
              aria-label={isRunning ? `Pause ${modeConfig.title.toLowerCase()} timer` : `Start ${modeConfig.title.toLowerCase()} timer`}
              aria-pressed={isRunning}
              autoFocus
            >
              {isRunning ? <Pause className="w-6 h-6" aria-hidden="true" /> : <Play className="w-6 h-6" aria-hidden="true" />}
              <span>{isRunning ? 'Pause' : 'Start'}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetTimer}
              className="btn-ghost flex items-center space-x-2 focus-ring"
              aria-label="Reset timer to beginning"
            >
              <RotateCcw className="w-5 h-5" aria-hidden="true" />
              <span>Reset</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={skipSession}
              className="btn-ghost flex items-center space-x-2 focus-ring"
              aria-label={`Skip current ${modeConfig.title.toLowerCase()} session`}
            >
              <span>Skip</span>
            </motion.button>
          </motion.div>

          {/* Enhanced Quick Actions */}
          <motion.div 
            className="relative z-10 flex justify-center space-x-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowSettings(true)}
              className="control-icon focus-ring"
              aria-label="Open timer settings"
              title="Settings"
            >
              <Settings className="w-6 h-6 text-white" aria-hidden="true" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="control-icon focus-ring"
              aria-label={soundEnabled ? "Disable notification sounds" : "Enable notification sounds"}
              aria-pressed={soundEnabled}
              title={soundEnabled ? "Disable Sound" : "Enable Sound"}
            >
              {soundEnabled ? 
                <Volume2 className="w-6 h-6 text-white" aria-hidden="true" /> : 
                <VolumeX className="w-6 h-6 text-white" aria-hidden="true" />
              }
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSettings(prev => ({ ...prev, darkMode: !prev.darkMode }))}
              className="control-icon focus-ring"
              aria-label={settings.darkMode ? "Switch to light mode" : "Switch to dark mode"}
              aria-pressed={settings.darkMode}
              title={settings.darkMode ? "Light Mode" : "Dark Mode"}
            >
              <motion.div
                animate={{ rotate: settings.darkMode ? 180 : 0 }}
                transition={{ duration: 0.5 }}
              >
                {settings.darkMode ? 
                  <Sun className="w-6 h-6 text-white" aria-hidden="true" /> : 
                  <Moon className="w-6 h-6 text-white" aria-hidden="true" />
                }
              </motion.div>
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Enhanced Stats */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.6 }}
        >
          <motion.div 
            className="card-stats p-8 text-center group"
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-success-500 to-success-600 rounded-2xl flex items-center justify-center shadow-lg"
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <CheckCircle className="w-8 h-8 text-white" />
            </motion.div>
            <motion.div 
              className="text-4xl font-bold text-white mb-2"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {completedSessions}
            </motion.div>
            <div className="text-base font-medium text-white/80">
              Completed Sessions
            </div>
            <div className="text-sm text-white/60 mt-1">
              Keep going! 💪
            </div>
          </motion.div>
          
          <motion.div 
            className="card-stats p-8 text-center group"
            whileHover={{ scale: 1.02, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-2xl flex items-center justify-center shadow-lg"
              whileHover={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <Clock className="w-8 h-8 text-white" />
            </motion.div>
            <motion.div 
              className="text-4xl font-bold text-white mb-2"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            >
              {Math.floor(totalFocusTime / 60)}h {totalFocusTime % 60}m
            </motion.div>
            <div className="text-base font-medium text-white/80">
              Total Focus Time
            </div>
            <div className="text-sm text-white/60 mt-1">
              Time well spent! ⏰
            </div>
          </motion.div>
        </motion.div>

        {/* Settings Modal */}
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          settings={settings}
          onUpdateSettings={updateSettings}
          exportData={exportData}
          resetAllData={resetAllData}
        />
      </motion.div>

      {/* Enhanced Toast Notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: settings.darkMode ? 'rgba(55, 65, 81, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            color: settings.darkMode ? '#f3f4f6' : '#1f2937',
            borderRadius: '16px',
            backdropFilter: 'blur(16px)',
            border: `1px solid ${settings.darkMode ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.3)'}`,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            fontSize: '16px',
            fontWeight: '500',
            padding: '16px 20px',
          }
        }}
      />
    </div>
  );
}

// Enhanced Settings Modal Component
function SettingsModal({ isOpen, onClose, settings, onUpdateSettings, exportData, resetAllData }) {
  const [tempSettings, setTempSettings] = useState(settings);

  useEffect(() => {
    setTempSettings(settings);
  }, [settings]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpen) return;
      
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Focus trap - focus the first focusable element
      const firstFocusable = document.querySelector('[data-modal-content] button, [data-modal-content] input, [data-modal-content] [tabindex]:not([tabindex="-1"])');
      if (firstFocusable) {
        setTimeout(() => firstFocusable.focus(), 100);
      }
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSave = () => {
    onUpdateSettings(tempSettings);
    onClose();
    toast.success('Settings saved successfully!', { 
      icon: '⚙️',
      duration: 3000
    });
  };

  const updateSetting = (key, value) => {
    setTempSettings(prev => ({ ...prev, [key]: value }));
  };

  const adjustTime = (key, delta) => {
    setTempSettings(prev => ({
      ...prev,
      [key]: Math.max(1, Math.min(60, prev[key] + delta))
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-modal-title"
        >
          <motion.div
            className="modal-content"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            data-modal-content
          >
            {/* Enhanced Header */}
            <div className="p-8 border-b border-white/[0.1] dark:border-neutral-700/[0.2]">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <motion.div
                    className="p-3 mr-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl shadow-lg"
                    whileHover={{ rotate: 90 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Settings className="w-6 h-6 text-white" />
                  </motion.div>
                  <h3 id="settings-modal-title" className="text-2xl font-bold text-neutral-800 dark:text-white">
                    Settings
                  </h3>
                </div>
                <motion.button
                  onClick={onClose}
                  className="p-3 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-2xl transition-colors focus-ring"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Close settings modal"
                >
                  <X className="w-6 h-6 text-neutral-600 dark:text-neutral-400" aria-hidden="true" />
                </motion.button>
              </div>
            </div>

            {/* Enhanced Content */}
            <div className="p-8 space-y-8 max-h-[60vh] overflow-y-auto">
              {/* Timer Durations */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h4 className="text-xl font-bold text-neutral-800 dark:text-white mb-6 flex items-center">
                  <Timer className="w-5 h-5 mr-2 text-primary-500" />
                  Timer Durations
                </h4>
                
                <div className="space-y-6">
                  {/* Work Duration */}
                  <div className="bg-gradient-to-br from-white/[0.1] to-white/[0.05] dark:from-neutral-800/[0.1] dark:to-neutral-800/[0.05] backdrop-blur-md rounded-2xl p-6 border border-white/[0.1] dark:border-neutral-700/[0.2]">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-base font-semibold text-neutral-700 dark:text-neutral-300">
                          Work Duration
                        </label>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                          Focus session length
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <motion.button
                          onClick={() => adjustTime('workDuration', -5)}
                          className="p-2 bg-neutral-200/50 dark:bg-neutral-700/50 hover:bg-neutral-300/50 dark:hover:bg-neutral-600/50 rounded-xl transition-colors focus-ring"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          aria-label="Decrease work duration by 5 minutes"
                        >
                          <Minus className="w-4 h-4" aria-hidden="true" />
                        </motion.button>
                        <span className="w-20 text-center font-mono text-lg font-bold bg-white/[0.1] dark:bg-neutral-800/[0.1] rounded-xl py-2 px-3 border border-white/[0.2] dark:border-neutral-700/[0.2]">
                          {tempSettings.workDuration}m
                        </span>
                        <motion.button
                          onClick={() => adjustTime('workDuration', 5)}
                          className="p-2 bg-neutral-200/50 dark:bg-neutral-700/50 hover:bg-neutral-300/50 dark:hover:bg-neutral-600/50 rounded-xl transition-colors focus-ring"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          aria-label="Increase work duration by 5 minutes"
                        >
                          <Plus className="w-4 h-4" aria-hidden="true" />
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* Short Break Duration */}
                  <div className="bg-gradient-to-br from-white/[0.1] to-white/[0.05] dark:from-neutral-800/[0.1] dark:to-neutral-800/[0.05] backdrop-blur-md rounded-2xl p-6 border border-white/[0.1] dark:border-neutral-700/[0.2]">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-base font-semibold text-neutral-700 dark:text-neutral-300">
                          Short Break
                        </label>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                          Quick rest between sessions
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <motion.button
                          onClick={() => adjustTime('shortBreakDuration', -1)}
                          className="p-2 bg-neutral-200/50 dark:bg-neutral-700/50 hover:bg-neutral-300/50 dark:hover:bg-neutral-600/50 rounded-xl transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Minus className="w-4 h-4" />
                        </motion.button>
                        <span className="w-20 text-center font-mono text-lg font-bold bg-white/[0.1] dark:bg-neutral-800/[0.1] rounded-xl py-2 px-3 border border-white/[0.2] dark:border-neutral-700/[0.2]">
                          {tempSettings.shortBreakDuration}m
                        </span>
                        <motion.button
                          onClick={() => adjustTime('shortBreakDuration', 1)}
                          className="p-2 bg-neutral-200/50 dark:bg-neutral-700/50 hover:bg-neutral-300/50 dark:hover:bg-neutral-600/50 rounded-xl transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Plus className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* Long Break Duration */}
                  <div className="bg-gradient-to-br from-white/[0.1] to-white/[0.05] dark:from-neutral-800/[0.1] dark:to-neutral-800/[0.05] backdrop-blur-md rounded-2xl p-6 border border-white/[0.1] dark:border-neutral-700/[0.2]">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-base font-semibold text-neutral-700 dark:text-neutral-300">
                          Long Break
                        </label>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                          Extended rest period
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <motion.button
                          onClick={() => adjustTime('longBreakDuration', -5)}
                          className="p-2 bg-neutral-200/50 dark:bg-neutral-700/50 hover:bg-neutral-300/50 dark:hover:bg-neutral-600/50 rounded-xl transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Minus className="w-4 h-4" />
                        </motion.button>
                        <span className="w-20 text-center font-mono text-lg font-bold bg-white/[0.1] dark:bg-neutral-800/[0.1] rounded-xl py-2 px-3 border border-white/[0.2] dark:border-neutral-700/[0.2]">
                          {tempSettings.longBreakDuration}m
                        </span>
                        <motion.button
                          onClick={() => adjustTime('longBreakDuration', 5)}
                          className="p-2 bg-neutral-200/50 dark:bg-neutral-700/50 hover:bg-neutral-300/50 dark:hover:bg-neutral-600/50 rounded-xl transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Plus className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* Long Break Interval */}
                  <div className="bg-gradient-to-br from-white/[0.1] to-white/[0.05] dark:from-neutral-800/[0.1] dark:to-neutral-800/[0.05] backdrop-blur-md rounded-2xl p-6 border border-white/[0.1] dark:border-neutral-700/[0.2]">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-base font-semibold text-neutral-700 dark:text-neutral-300">
                          Long Break Interval
                        </label>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                          Sessions before long break
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <motion.button
                          onClick={() => adjustTime('longBreakInterval', -1)}
                          className="p-2 bg-neutral-200/50 dark:bg-neutral-700/50 hover:bg-neutral-300/50 dark:hover:bg-neutral-600/50 rounded-xl transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Minus className="w-4 h-4" />
                        </motion.button>
                        <span className="w-20 text-center font-mono text-lg font-bold bg-white/[0.1] dark:bg-neutral-800/[0.1] rounded-xl py-2 px-3 border border-white/[0.2] dark:border-neutral-700/[0.2]">
                          {tempSettings.longBreakInterval}
                        </span>
                        <motion.button
                          onClick={() => adjustTime('longBreakInterval', 1)}
                          className="p-2 bg-neutral-200/50 dark:bg-neutral-700/50 hover:bg-neutral-300/50 dark:hover:bg-neutral-600/50 rounded-xl transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Plus className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Automation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h4 className="text-xl font-bold text-neutral-800 dark:text-white mb-6 flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-secondary-500" />
                  Automation & Preferences
                </h4>
                
                <div className="space-y-4">
                  {[
                    { key: 'autoStartBreaks', label: 'Auto-start breaks', desc: 'Automatically start break sessions' },
                    { key: 'autoStartWork', label: 'Auto-start work sessions', desc: 'Automatically start work sessions after breaks' },
                    { key: 'soundEnabled', label: 'Enable notifications', desc: 'Play sound when sessions complete' },
                    { key: 'darkMode', label: 'Dark mode', desc: 'Use dark color scheme' }
                  ].map((setting, index) => (
                    <motion.label
                      key={setting.key}
                      className="flex items-center justify-between p-4 bg-gradient-to-br from-white/[0.1] to-white/[0.05] dark:from-neutral-800/[0.1] dark:to-neutral-800/[0.05] backdrop-blur-md rounded-2xl border border-white/[0.1] dark:border-neutral-700/[0.2] cursor-pointer hover:bg-white/[0.15] dark:hover:bg-neutral-800/[0.15] transition-all duration-200"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div>
                        <span className="text-base font-semibold text-neutral-700 dark:text-neutral-300">
                          {setting.label}
                        </span>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                          {setting.desc}
                        </p>
                      </div>
                      <motion.div
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          tempSettings[setting.key] 
                            ? 'bg-gradient-to-r from-primary-500 to-primary-600' 
                            : 'bg-neutral-300 dark:bg-neutral-600'
                        }`}
                        onClick={() => updateSetting(setting.key, !tempSettings[setting.key])}
                        role="switch"
                        aria-checked={tempSettings[setting.key]}
                        aria-label={setting.label}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            updateSetting(setting.key, !tempSettings[setting.key]);
                          }
                        }}
                      >
                        <motion.div
                          className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-lg"
                          animate={{
                            x: tempSettings[setting.key] ? 24 : 2
                          }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        />
                      </motion.div>
                    </motion.label>
                  ))}
                </div>
              </motion.div>

              {/* Data Management Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h4 className="text-xl font-bold text-neutral-800 dark:text-white mb-6 flex items-center">
                  <Save className="w-5 h-5 mr-2 text-accent-500" />
                  Data Management
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.button
                    onClick={exportData}
                    className="p-4 bg-gradient-to-br from-success-500/10 to-success-600/10 hover:from-success-500/20 hover:to-success-600/20 border border-success-500/20 rounded-2xl transition-all duration-200 text-left"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="text-base font-semibold text-success-600 dark:text-success-400">
                      Export Data
                    </div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                      Backup your progress
                    </div>
                  </motion.button>

                  <motion.button
                    onClick={resetAllData}
                    className="p-4 bg-gradient-to-br from-red-500/10 to-red-600/10 hover:from-red-500/20 hover:to-red-600/20 border border-red-500/20 rounded-2xl transition-all duration-200 text-left"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="text-base font-semibold text-red-600 dark:text-red-400">
                      Reset All Data
                    </div>
                    <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                      Clear everything
                    </div>
                  </motion.button>
                </div>
              </motion.div>
            </div>

            {/* Enhanced Footer */}
            <div className="p-8 border-t border-white/[0.1] dark:border-neutral-700/[0.2]">
              <div className="flex justify-end space-x-4">
                <motion.button
                  onClick={onClose}
                  className="px-6 py-3 text-base font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-2xl transition-colors focus-ring"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  aria-label="Cancel and close settings without saving"
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleSave}
                  className="btn-primary flex items-center space-x-3 focus-ring"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  aria-label="Save settings and close modal"
                >
                  <Save className="w-5 h-5" aria-hidden="true" />
                  <span>Save Settings</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App; 