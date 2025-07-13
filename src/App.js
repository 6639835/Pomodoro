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

function App() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [currentMode, setCurrentMode] = useState(TIMER_MODES.WORK);
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(settings.darkMode);
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);
  
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  // Initialize audio
  useEffect(() => {
    // Create audio context for notification sounds
    if (soundEnabled) {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      const playNotificationSound = (frequency = 800, duration = 200) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration / 1000);
      };
      
      audioRef.current = { playNotificationSound };
    }
  }, [soundEnabled]);

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft]);

  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
    setIsRunning(false);
    
    // Play notification sound
    if (soundEnabled && audioRef.current) {
      audioRef.current.playNotificationSound(800, 300);
      setTimeout(() => audioRef.current.playNotificationSound(1000, 300), 400);
    }

    if (currentMode === TIMER_MODES.WORK) {
      const newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      setTotalSessions(prev => prev + 1);
      
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
  }, [currentMode, completedSessions, settings, soundEnabled]);

  // Control functions
  const startTimer = () => {
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setCurrentMode(TIMER_MODES.WORK);
    setTimeLeft(settings.workDuration * 60);
    toast.success('Timer reset!', { icon: '🔄' });
  };

  const skipSession = () => {
    setIsRunning(false);
    handleTimerComplete();
  };

  // Settings functions
  const updateSettings = (newSettings) => {
    setSettings(newSettings);
    
    // Update current timer if not running
    if (!isRunning) {
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
    }
    
    setDarkMode(newSettings.darkMode);
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
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg"
      >
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-4xl font-bold text-white mb-2 text-shadow">
            Pomodoro Timer
          </h1>
          <p className="text-white/80">Boost your productivity with focused work sessions</p>
        </motion.div>

        {/* Main Timer Card */}
        <motion.div
          className="card p-8 text-center relative overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* Background Animation */}
          <div className={`absolute inset-0 bg-gradient-to-br ${modeConfig.bgColor} opacity-5`} />
          
          {/* Mode Header */}
          <div className="relative z-10 mb-6">
            <div className="flex items-center justify-center mb-2">
              <modeConfig.icon className="w-6 h-6 mr-2" style={{ color: modeConfig.color }} />
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
                {modeConfig.title}
              </h2>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Session {completedSessions + 1} of {settings.longBreakInterval}
            </div>
          </div>

          {/* Timer Display */}
          <div className="relative z-10 mb-8">
            <div className="w-64 h-64 mx-auto relative">
              <CircularProgressbar
                value={getProgress()}
                text={formatTime(timeLeft)}
                styles={buildStyles({
                  rotation: 0,
                  strokeLinecap: 'round',
                  pathTransition: 'stroke-dashoffset 1s ease',
                  pathColor: modeConfig.color,
                  textColor: darkMode ? '#f7fafc' : '#1a202c',
                  trailColor: darkMode ? '#4a5568' : '#e2e8f0',
                  backgroundColor: modeConfig.color,
                  textSize: '14px'
                })}
              />
              
              {/* Pulse effect when running */}
              {isRunning && (
                <div 
                  className="absolute inset-0 rounded-full animate-pulse-ring"
                  style={{ 
                    background: `radial-gradient(circle, ${modeConfig.color}20 0%, transparent 70%)` 
                  }}
                />
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="relative z-10 flex justify-center space-x-4 mb-6">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={isRunning ? pauseTimer : startTimer}
              className={`btn-primary flex items-center space-x-2 ${
                isRunning ? 'bg-gradient-to-r from-warning-500 to-warning-600' : ''
              }`}
            >
              {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              <span>{isRunning ? 'Pause' : 'Start'}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetTimer}
              className="btn-ghost flex items-center space-x-2"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Reset</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={skipSession}
              className="btn-ghost flex items-center space-x-2"
            >
              <span>Skip</span>
            </motion.button>
          </div>

          {/* Quick Actions */}
          <div className="relative z-10 flex justify-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSettings(true)}
              className="p-3 bg-white/20 dark:bg-gray-800/20 rounded-full backdrop-blur-sm hover:bg-white/30 transition-colors"
            >
              <Settings className="w-5 h-5 text-white" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-3 bg-white/20 dark:bg-gray-800/20 rounded-full backdrop-blur-sm hover:bg-white/30 transition-colors"
            >
              {soundEnabled ? 
                <Volume2 className="w-5 h-5 text-white" /> : 
                <VolumeX className="w-5 h-5 text-white" />
              }
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setDarkMode(!darkMode)}
              className="p-3 bg-white/20 dark:bg-gray-800/20 rounded-full backdrop-blur-sm hover:bg-white/30 transition-colors"
            >
              {darkMode ? 
                <Sun className="w-5 h-5 text-white" /> : 
                <Moon className="w-5 h-5 text-white" />
              }
            </motion.button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 gap-4 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="card p-6 text-center">
            <CheckCircle className="w-8 h-8 text-success-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800 dark:text-white">
              {completedSessions}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Completed Sessions
            </div>
          </div>
          
          <div className="card p-6 text-center">
            <Clock className="w-8 h-8 text-secondary-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800 dark:text-white">
              {Math.floor(totalSessions * settings.workDuration / 60)}h {(totalSessions * settings.workDuration) % 60}m
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Focus Time
            </div>
          </div>
        </motion.div>

        {/* Settings Modal */}
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          settings={settings}
          onUpdateSettings={updateSettings}
        />
      </motion.div>

      {/* Toast Notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: darkMode ? '#374151' : '#ffffff',
            color: darkMode ? '#f3f4f6' : '#1f2937',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          }
        }}
      />
    </div>
  );
}

// Settings Modal Component
function SettingsModal({ isOpen, onClose, settings, onUpdateSettings }) {
  const [tempSettings, setTempSettings] = useState(settings);

  useEffect(() => {
    setTempSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onUpdateSettings(tempSettings);
    onClose();
    toast.success('Settings saved!', { icon: '⚙️' });
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
        >
          <motion.div
            className="modal-content"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Settings
                </h3>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Timer Durations */}
              <div>
                <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
                  Timer Durations
                </h4>
                
                <div className="space-y-4">
                  {/* Work Duration */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Work Duration
                    </label>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => adjustTime('workDuration', -5)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-16 text-center font-mono">
                        {tempSettings.workDuration}m
                      </span>
                      <button
                        onClick={() => adjustTime('workDuration', 5)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Short Break Duration */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Short Break
                    </label>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => adjustTime('shortBreakDuration', -1)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-16 text-center font-mono">
                        {tempSettings.shortBreakDuration}m
                      </span>
                      <button
                        onClick={() => adjustTime('shortBreakDuration', 1)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Long Break Duration */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Long Break
                    </label>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => adjustTime('longBreakDuration', -5)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-16 text-center font-mono">
                        {tempSettings.longBreakDuration}m
                      </span>
                      <button
                        onClick={() => adjustTime('longBreakDuration', 5)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Long Break Interval */}
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Long Break Interval
                    </label>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => adjustTime('longBreakInterval', -1)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-16 text-center font-mono">
                        {tempSettings.longBreakInterval}
                      </span>
                      <button
                        onClick={() => adjustTime('longBreakInterval', 1)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Automation */}
              <div>
                <h4 className="text-lg font-medium text-gray-800 dark:text-white mb-4">
                  Automation
                </h4>
                
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={tempSettings.autoStartBreaks}
                      onChange={(e) => updateSetting('autoStartBreaks', e.target.checked)}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Auto-start breaks
                    </span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={tempSettings.autoStartWork}
                      onChange={(e) => updateSetting('autoStartWork', e.target.checked)}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Auto-start work sessions
                    </span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={tempSettings.soundEnabled}
                      onChange={(e) => updateSetting('soundEnabled', e.target.checked)}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Enable notifications
                    </span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={tempSettings.darkMode}
                      onChange={(e) => updateSetting('darkMode', e.target.checked)}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Dark mode
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Settings</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App; 