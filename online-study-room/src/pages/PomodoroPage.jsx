import React, { useState } from "react";
import Navbar from "../components/Navbar";
import { usePomodoro } from "../context/PomodoroContext";

const PomodoroPage = ({ user }) => {
    // Consume global Pomodoro state
    const { 
        mode, 
        time, 
        running, 
        focusTasks, 
        setFocusTasks, 
        format, 
        switchMode, 
        toggleTimer, 
        resetTimer
    } = usePomodoro();


    const [newTaskText, setNewTaskText] = useState("");

    const handleAddTask = (e) => {
        e.preventDefault();
        if (!newTaskText.trim()) return;
        setFocusTasks([...focusTasks, { id: Date.now(), text: newTaskText.trim(), completed: false }]);
        setNewTaskText("");
    };

    const toggleTask = (id) => {
        setFocusTasks(focusTasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const deleteTask = (id) => {
        setFocusTasks(focusTasks.filter(t => t.id !== id));
    };

    // Determine aesthetics
    const title = mode === 'work' ? "Focus Session" : "Break Time";
    const primaryColor = mode === 'work' ? '#818cf8' : '#34d399'; // Indigo for work, Green for break

    return (
        <div>
            <Navbar user={user} setUser={() => {}} />
            <div className="container mt-5">
                
                {/* 5. MAIN TIMER CARD */}
                <div 
                    className="glass-panel p-5 text-center mx-auto" 
                    style={{ 
                        maxWidth: '450px', 
                        border: `2px solid ${running ? primaryColor : 'rgba(255,255,255,0.1)'}`,
                        boxShadow: running ? `0 0 30px ${primaryColor}40` : '',
                        transition: 'all 0.5s ease-in-out'
                    }}
                >
                    <h2 className="mb-4 fw-bolder" style={{ color: primaryColor }}>
                        {title}
                    </h2>

                    {/* Mode Selector Buttons */}
                    <div className="glass-panel d-inline-flex p-1 rounded-pill mb-5 shadow-sm mx-auto" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                        <button 
                            className={`btn btn-sm rounded-pill px-4 py-2 border-0 transition-all ${mode === 'work' ? 'text-white shadow' : 'text-secondary'}`}
                            style={{ 
                                background: mode === 'work' ? 'var(--premium-gradient)' : 'transparent',
                                fontWeight: mode === 'work' ? 'bold' : 'normal'
                            }}
                            onClick={() => switchMode('work')}
                        >
                            <i className="bi bi-briefcase me-1"></i> Focus
                        </button>
                        <button 
                            className={`btn btn-sm rounded-pill px-4 py-2 border-0 transition-all ${mode === 'short_break' ? 'text-white shadow' : 'text-secondary'}`}
                            style={{ 
                                background: mode === 'short_break' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'transparent',
                                fontWeight: mode === 'short_break' ? 'bold' : 'normal'
                            }}
                            onClick={() => switchMode('short_break')}
                        >
                            <i className="bi bi-cup-hot me-1"></i> Break
                        </button>
                    </div>
                    


                    {/* Timer Display */}
                    <h1 className="display-1 fw-bolder mb-5" style={{ color: primaryColor, letterSpacing: '4px', textShadow: `0 0 20px ${primaryColor}40` }}>
                        {format(time)}
                    </h1>
                    
                    {/* Control Buttons */}
                    <div className="mt-3 text-center">
                        <button 
                            className={`btn btn-lg ${running ? 'btn-outline-light' : 'btn-premium'} me-3 rounded-pill px-4 fs-5`} 
                            onClick={toggleTimer}
                        >
                            <i className={`bi ${running ? 'bi-pause-fill' : 'bi-play-fill'} me-2`}></i>
                            {running ? 'Pause' : 'Start'}
                        </button>
                        <button 
                            className="btn btn-lg btn-outline-secondary rounded-pill px-4 fs-5" 
                            onClick={resetTimer} 
                        >
                            <i className="bi bi-arrow-counterclockwise me-2"></i>
                            Reset
                        </button>
                    </div>
                </div>

                {/* 6. CURRENT GOAL BOX */}
                <div className="glass-panel p-4 mt-5 mx-auto" style={{ maxWidth: '600px' }}>
                    <h5 className="text-white mb-4 fw-bold d-flex align-items-center">
                        <i className="bi bi-list-check me-2 fs-4 text-primary"></i> Focus Tasks
                    </h5>
                    
                    <ul className="list-group list-group-flush mb-4">
                        {focusTasks.map((task) => (
                            <li key={task.id} className="list-group-item bg-transparent text-white border-bottom border-0 border-secondary border-opacity-25 px-1 py-3 d-flex align-items-center">
                                <input 
                                    className="form-check-input me-3 mt-0 cursor-pointer shadow-sm border-secondary border-opacity-50 flex-shrink-0" 
                                    type="checkbox" 
                                    checked={task.completed}
                                    onChange={() => toggleTask(task.id)}
                                    style={{ width: '24px', height: '24px' }}
                                />
                                <span className={`flex-grow-1 fw-medium ${task.completed ? 'text-secondary text-decoration-line-through' : ''}`} style={{ transition: 'all 0.2s', fontSize: '1.05rem' }}>
                                    {task.text}
                                </span>
                                <button className="btn btn-sm text-secondary hover-text-danger p-1 rounded-circle ms-2" onClick={() => deleteTask(task.id)}>
                                    <i className="bi bi-x fs-4"></i>
                                </button>
                            </li>
                        ))}
                        {focusTasks.length === 0 && (
                            <li className="list-group-item bg-transparent text-secondary border-0 px-0 fst-italic">
                                No tasks added yet. Add a focus goal below!
                            </li>
                        )}
                    </ul>

                    <form onSubmit={handleAddTask} className="d-flex gap-2 bg-dark bg-opacity-50 p-1 rounded-4 border border-secondary border-opacity-25">
                        <input
                            type="text"
                            className="form-control premium-input border-0 bg-transparent shadow-none"
                            placeholder="Add a new task..."
                            value={newTaskText}
                            onChange={(e) => setNewTaskText(e.target.value)}
                        />
                        <button type="submit" className="btn btn-premium rounded-pill px-3 shadow-sm d-flex align-items-center justify-content-center" disabled={!newTaskText.trim()}>
                            <i className="bi bi-plus-lg fw-bold fs-5"></i>
                        </button>
                    </form>
                    
                    <small className="text-secondary mt-3 d-block text-end">Auto-saved automatically 💾</small>
                </div>

            </div>
        </div>
    );
};

export default PomodoroPage;