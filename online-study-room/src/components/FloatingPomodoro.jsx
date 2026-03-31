import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePomodoro } from '../context/PomodoroContext';

const FloatingPomodoro = () => {
    const { mode, running, time, format, toggleTimer } = usePomodoro();
    const navigate = useNavigate();
    const location = useLocation();

    const [position, setPosition] = useState({ 
        x: window.innerWidth - 240, 
        y: window.innerHeight - 100 
    });
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

    // Update position on resize
    useEffect(() => {
        const handleResize = () => {
            setPosition(prev => ({
                x: Math.min(prev.x, window.innerWidth - 200),
                y: Math.min(prev.y, window.innerHeight - 80)
            }));
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Hide on pages where the timer shouldn't be floating
    if (location.pathname === '/pomodoro' || location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/') {
        return null;
    }

    // Only render if timer is running OR if time is not at default WORK_TIME
    if (!running && time === 25 * 60) return null;

    const handlePointerDown = (e) => {
        setIsDragging(true);
        dragRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            initialX: position.x,
            initialY: position.y
        };
        e.target.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e) => {
        if (!isDragging) return;
        
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        
        // Prevent going completely off screen
        const newX = Math.max(0, Math.min(window.innerWidth - 200, dragRef.current.initialX + dx));
        const newY = Math.max(0, Math.min(window.innerHeight - 80, dragRef.current.initialY + dy));
        
        setPosition({ x: newX, y: newY });
    };

    const handlePointerUp = (e) => {
        setIsDragging(false);
        e.target.releasePointerCapture(e.pointerId);
        
        // If it was a click (no movement), navigate to pomodoro page
        if (Math.abs(e.clientX - dragRef.current.startX) < 5 && Math.abs(e.clientY - dragRef.current.startY) < 5) {
            navigate('/pomodoro');
        }
    };

    const primaryColor = mode === 'work' ? '#818cf8' : '#34d399';

    return (
        <div 
            className="position-fixed glass-panel rounded-pill shadow-lg d-flex align-items-center z-3"
            style={{
                left: position.x,
                top: position.y,
                padding: '8px 16px',
                cursor: isDragging ? 'grabbing' : 'grab',
                border: `1px solid ${running ? primaryColor : 'rgba(255,255,255,0.1)'}`,
                boxShadow: running ? `0 0 15px ${primaryColor}40` : '',
                touchAction: 'none',
                userSelect: 'none'
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            <div className="d-flex align-items-center me-3 pointer-events-none" style={{ pointerEvents: 'none' }}>
                <i className={`bi ${mode === 'work' ? 'bi-briefcase-fill text-primary' : 'bi-cup-hot-fill text-success'} fs-5 me-2`}></i>
                <span className="fw-bolder fs-5 text-white" style={{ fontVariantNumeric: 'tabular-nums', width: '55px' }}>
                    {format(time)}
                </span>
            </div>
            
            <div className="d-flex border-start border-secondary border-opacity-50 ps-2 gap-1" style={{ pointerEvents: 'auto' }}>
                <button 
                    className="btn btn-sm text-white p-1" 
                    onClick={(e) => { e.stopPropagation(); toggleTimer(); }}
                    title={running ? "Pause" : "Play"}
                >
                    <i className={`bi ${running ? 'bi-pause-circle-fill text-warning' : 'bi-play-circle-fill text-success'} fs-5`}></i>
                </button>
                <button 
                    className="btn btn-sm text-secondary p-1" 
                    onClick={(e) => { e.stopPropagation(); navigate('/pomodoro'); }}
                    title="Open Pomodoro Page"
                >
                    <i className="bi bi-arrows-angle-expand fs-6"></i>
                </button>
            </div>
        </div>
    );
};

export default FloatingPomodoro;
