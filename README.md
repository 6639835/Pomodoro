# 🍅 Modern Pomodoro Timer

A beautiful, modern Pomodoro timer built with React, featuring smooth animations, dark mode, and an intuitive user interface designed to boost your productivity.

## ✨ Features

- **🎯 Classic Pomodoro Technique**: 25-minute work sessions with 5-minute short breaks and 15-minute long breaks
- **🎨 Beautiful UI**: Modern design with smooth animations and glass-morphism effects
- **🌙 Dark Mode**: Automatic dark mode detection with manual toggle
- **⚙️ Customizable Settings**: Adjust work/break durations, auto-start preferences, and notification settings
- **🔊 Audio Notifications**: Gentle sound notifications when sessions complete
- **📊 Progress Tracking**: Visual progress indicator and session statistics
- **📱 Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **🎭 Smooth Animations**: Powered by Framer Motion for delightful interactions
- **🔔 Toast Notifications**: Real-time feedback with beautiful toast messages

## 🚀 Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pomodoro-timer
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### Building for Production

To create a production build:

```bash
npm run build
```

The build folder will contain the optimized production files.

## 🎮 How to Use

1. **Start a Session**: Click the "Start" button to begin a 25-minute work session
2. **Take Breaks**: The timer automatically switches between work and break modes
3. **Customize Settings**: Click the settings icon to adjust durations and preferences
4. **Track Progress**: View your completed sessions and total focus time
5. **Use Controls**: Start, pause, reset, or skip sessions as needed

## 🛠️ Tech Stack

- **React 18** - Modern React with hooks
- **Framer Motion** - Smooth animations and transitions
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful, customizable icons
- **React Hot Toast** - Elegant toast notifications
- **React Circular Progressbar** - Smooth circular progress indicator

## 📱 Features in Detail

### Timer Modes
- **Work Session**: 25 minutes of focused work time
- **Short Break**: 5-minute break between work sessions
- **Long Break**: 15-minute break every 4 work sessions

### Customization Options
- Work duration (1-60 minutes)
- Short break duration (1-30 minutes)
- Long break duration (1-60 minutes)
- Long break interval (2-10 sessions)
- Auto-start preferences
- Sound notifications
- Dark/light mode

### Statistics
- Completed sessions counter
- Total focus time tracking
- Session progress indicator

## 🎨 Design Philosophy

This Pomodoro timer prioritizes:
- **Simplicity**: Clean, distraction-free interface
- **Beauty**: Modern design with smooth animations
- **Accessibility**: High contrast, clear typography, and intuitive controls
- **Responsiveness**: Works seamlessly across all devices
- **User Experience**: Thoughtful interactions and feedback

## 🔧 Configuration

The app uses sensible defaults but everything can be customized:

```javascript
const DEFAULT_SETTINGS = {
  workDuration: 25,           // Work session length in minutes
  shortBreakDuration: 5,      // Short break length in minutes
  longBreakDuration: 15,      // Long break length in minutes
  longBreakInterval: 4,       // Work sessions before long break
  autoStartBreaks: true,      // Auto-start break sessions
  autoStartWork: false,       // Auto-start work sessions
  soundEnabled: true,         // Enable sound notifications
  darkMode: false            // Dark mode preference
};
```

## 📦 Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Inspired by the Pomodoro Technique® by Francesco Cirillo
- Built with modern web technologies for optimal performance
- Designed with productivity and user experience in mind

---

**Happy focusing! 🍅✨** 