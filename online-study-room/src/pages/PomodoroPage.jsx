// src/pages/PomodoroPage.jsx - FINAL AESTHETIC & FUNCTIONAL REPLACEMENT
import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";

// Define time constants in seconds
const WORK_TIME = 25 * 60; 
const SHORT_BREAK = 5 * 60;  

const PomodoroPage = ({ user }) => {
    // State to track the current mode: 'work', 'short_break'
    const [mode, setMode] = useState('work'); 
    const [time, setTime] = useState(WORK_TIME);
    const [running, setRunning] = useState(false);
    const [studyGoal, setStudyGoal] = useState(() => localStorage.getItem('pomodoroGoal') || 'Focus on completing the final touches.');

    // Save goal locally on change
    useEffect(() => {
        localStorage.setItem('pomodoroGoal', studyGoal);
    }, [studyGoal]);

    const getTimeForMode = (m) => {
        return m === 'work' ? WORK_TIME : SHORT_BREAK;
    };

    // 1. Timer logic
    useEffect(() => {
        let interval;
        if (running && time > 0) {
            interval = setInterval(() => setTime((t) => t - 1), 1000);
        } else if (running && time === 0) {
            setRunning(false); 
            
            const nextMode = mode === 'work' ? 'short_break' : 'work';
            
            // Simple sound/notification using alert
            new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3').play();
            alert(`${mode === 'work' ? 'Time for a break! ☕' : 'Time to work! 🧠'} Click OK to start the next session.`);
            
            setMode(nextMode);
            setTime(getTimeForMode(nextMode)); 
            setRunning(true); // Auto-start next session
        }
        return () => clearInterval(interval);
    }, [running, time, mode]); 

    // 2. Format function
    const format = (t) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;

    // 3. Handle manual mode selection
    const switchMode = (newMode) => {
        setRunning(false);
        setMode(newMode);
        setTime(getTimeForMode(newMode));
    };
    
    // 4. Determine aesthetics
    const title = mode === 'work' ? "Focus Session" : "Break Time";
    const primaryColor = mode === 'work' ? '#DC3545' : '#198754'; // Danger (Red) for work, Success (Green) for break

    return (
        <div>
            <Navbar user={user} setUser={() => {}} />
            <div className="container mt-5">
                
                {/* 5. MAIN TIMER CARD (Reduced Size/Aesthetic) */}
                <div 
                    className="card p-4 shadow-lg mx-auto" 
                    style={{ 
                        maxWidth: '450px', 
                        border: `3px solid ${running ? primaryColor : '#ccc'}`,
                        transition: 'border-color 0.3s'
                    }}
                >
                    <h2 className="text-center mb-4 fw-bold" style={{ color: primaryColor }}>
                        {title}
                    </h2>

                    {/* Mode Selector Buttons */}
                    <div className="btn-group mb-4 shadow-sm mx-auto">
                        <button 
                            className={`btn btn-sm ${mode === 'work' ? 'btn-danger' : 'btn-outline-danger'}`}
                            onClick={() => switchMode('work')}
                        >
                            <i className="bi bi-briefcase me-1"></i> 25 Min
                        </button>
                        <button 
                            className={`btn btn-sm ${mode === 'short_break' ? 'btn-success' : 'btn-outline-success'}`}
                            onClick={() => switchMode('short_break')}
                        >
                            <i className="bi bi-cup-hot me-1"></i> 5 Min Break
                        </button>
                    </div>

                    {/* Timer Display */}
                    <h1 className="display-1 fw-bolder text-center mb-4" style={{ color: primaryColor, letterSpacing: '2px' }}>
                        {format(time)}
                    </h1>
                    
                    {/* Control Buttons */}
                    <div className="mt-2 text-center">
                        <button 
                            className={`btn btn-lg ${running ? 'btn-secondary' : 'btn-primary'} me-3`} 
                            onClick={() => setRunning(!running)}
                        >
                            <i className={`bi ${running ? 'bi-pause-fill' : 'bi-play-fill'} me-2`}></i>
                            {running ? 'Pause' : 'Start'}
                        </button>
                        <button 
                            className="btn btn-lg btn-outline-dark" 
                            onClick={() => switchMode(mode)} 
                        >
                            <i className="bi bi-arrow-counterclockwise me-2"></i>
                            Reset
                        </button>
                    </div>
                </div>

                {/* 6. CURRENT GOAL BOX (Fills Empty Space Professionally) */}
                <div className="card p-4 mt-5 mx-auto shadow-sm bg-white" style={{ maxWidth: '600px' }}>
                    <h5 className="text-dark mb-3">
                        <i className="bi bi-bullseye me-2 text-primary"></i> Current Focus Goal
                    </h5>
                    <textarea
                        className="form-control"
                        rows="2"
                        placeholder="Define your task for this Pomodoro cycle..."
                        value={studyGoal}
                        onChange={(e) => setStudyGoal(e.target.value)}
                        style={{ resize: 'none', borderColor: '#e9ecef' }}
                    />
                    <small className="text-muted mt-2">Goal is saved locally across sessions.</small>
                </div>

            </div>
        </div>
    );
};

export default PomodoroPage;