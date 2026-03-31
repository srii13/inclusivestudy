import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from "socket.io-client";

const PomodoroContext = createContext();

const WORK_TIME = 25 * 60; 
const SHORT_BREAK = 5 * 60;  

export const PomodoroProvider = ({ children }) => {
    const [mode, setMode] = useState('work'); 
    const [time, setTime] = useState(WORK_TIME);
    const [running, setRunning] = useState(false);
    const [isFocusViolated, setIsFocusViolated] = useState(false);
    const [studyField, setStudyField] = useState('General Studies');
    
    // Store original focus duration to calculate XP accurately if timer is changed
    const originalDurationRef = useRef(WORK_TIME);
    
    const [focusTasks, setFocusTasks] = useState(() => {
        const stored = localStorage.getItem('pomodoroTasks');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                return [];
            }
        }
        // Fallback for previous users who had a single goal
        const oldGoal = localStorage.getItem('pomodoroGoal');
        if (oldGoal) {
            return [{ id: Date.now(), text: oldGoal, completed: false }];
        }
        return [{ id: Date.now(), text: 'Focus on completing the final touches.', completed: false }];
    });

    // Save tasks locally on change
    useEffect(() => {
        localStorage.setItem('pomodoroTasks', JSON.stringify(focusTasks));
    }, [focusTasks]);

    const getTimeForMode = (m) => {
        return m === 'work' ? WORK_TIME : SHORT_BREAK;
    };

    // Global Timer logic
    useEffect(() => {
        let interval;
        if (running && time > 0) {
            interval = setInterval(() => setTime((t) => t - 1), 1000);
        } else if (running && time === 0) {
            setRunning(false); 
            
            // IF it was a work session, give XP!
            if (mode === 'work') {
                const displayName = localStorage.getItem("displayName");
                if (displayName) {
                    const socket = io("http://localhost:3001");
                    const durationMinutes = Math.floor(originalDurationRef.current / 60);
                    socket.emit("pomodoro-completed", {
                        displayName,
                        durationMinutes,
                        studyField,
                        cheated: isFocusViolated
                    });
                    setTimeout(() => socket.disconnect(), 1000);
                }
            }

            const nextMode = mode === 'work' ? 'short_break' : 'work';
            originalDurationRef.current = getTimeForMode(nextMode);
            
            // Non-blocking standard chime
            new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3').play().catch(e => console.log(e));
            
            if (mode === 'work') {
                if (document.fullscreenElement) {
                    document.exitFullscreen().catch(e => console.log(e));
                }
            } else {
                try {
                    if (document.documentElement.requestFullscreen) {
                        document.documentElement.requestFullscreen().catch(e => console.log(e));
                    }
                } catch(e) {}
            }
            
            setMode(nextMode);
            setTime(getTimeForMode(nextMode)); 
            setRunning(true); // Auto-start next cycle continuously
        }
        return () => clearInterval(interval);
    }, [running, time, mode]); 

    // Focus Lock Listeners
    useEffect(() => {
        const checkViolation = () => {
            if (mode === 'work' && running) {
                if (document.hidden || !document.fullscreenElement) {
                    setIsFocusViolated(true);
                    setRunning(false); // Force pause timer on cheat
                }
            }
        };

        const onVisibilityChange = () => {
            if (document.hidden) checkViolation();
        };

        const onFullscreenChange = () => {
            if (!document.fullscreenElement) checkViolation();
        };

        document.addEventListener('visibilitychange', onVisibilityChange);
        document.addEventListener('fullscreenchange', onFullscreenChange);

        return () => {
            document.removeEventListener('visibilitychange', onVisibilityChange);
            document.removeEventListener('fullscreenchange', onFullscreenChange);
        };
    }, [mode, running]);

    // Handle manual mode selection
    const switchMode = (newMode) => {
        setRunning(false);
        setMode(newMode);
        const t = getTimeForMode(newMode);
        setTime(t);
        originalDurationRef.current = t;
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(e => console.log(e));
        }
    };

    const toggleTimer = async () => {
        if (!running && mode === 'work') {
            try {
                if (document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen();
                }
            } catch (err) {
                console.warn("Fullscreen API block:", err);
            }
        }
        setRunning(!running);
    };

    const resetTimer = () => {
        setRunning(false);
        setIsFocusViolated(false);
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(e => console.log(e));
        }
        const t = getTimeForMode(mode);
        setTime(t);
        originalDurationRef.current = t;
    };

    // Format function
    const format = (t) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;

    return (
        <PomodoroContext.Provider value={{
            mode, setMode, time, setTime, running, setRunning,
            focusTasks, setFocusTasks, format, switchMode, toggleTimer, resetTimer,
            isFocusViolated, setIsFocusViolated,
            studyField, setStudyField
        }}>
            {children}
        </PomodoroContext.Provider>
    );
};

export const usePomodoro = () => useContext(PomodoroContext);
