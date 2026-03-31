import React from 'react';
import { usePomodoro } from '../context/PomodoroContext';
import { useNavigate } from 'react-router-dom';

const FocusViolationOverlay = () => {
    const { isFocusViolated, setIsFocusViolated, setRunning, mode } = usePomodoro();
    const navigate = useNavigate();

    // Only render if a violation occurred and we are currently supposed to be in work mode
    if (!isFocusViolated || mode !== 'work') return null;

    const returnToFocus = async () => {
        setIsFocusViolated(false);
        try {
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
            }
        } catch (e) {
            console.warn("Fullscreen error", e);
        }
        setRunning(true); // Resume timer
    };

    const abandonSession = () => {
        if (!window.confirm("Are you sure you want to completely abandon this focus session? You will lose momentum.")) return;
        setIsFocusViolated(false);
        setRunning(false); // Make sure timer is paused
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(e => console.log(e));
        }
        navigate('/pomodoro'); 
    };

    return (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center bg-danger bg-opacity-75" style={{ backdropFilter: 'blur(35px)', zIndex: 9999 }}>
            <div className="text-center bg-dark p-5 rounded-4 shadow-lg border border-danger border-opacity-50" style={{ maxWidth: '600px' }}>
                <i className="bi bi-shield-fill-exclamation text-danger mb-4" style={{ fontSize: '5rem', display: 'block' }}></i>
                <h1 className="text-white fw-bolder mb-3 display-5 pulse-animation" style={{ letterSpacing: '2px' }}>FOCUS BROKEN</h1>
                <p className="text-secondary fs-5 mb-5 lh-base">
                    You exited fullscreen or switched tabs during a deep work session. <br/>This severely impacts your momentum.
                </p>
                <div className="d-flex flex-column gap-3">
                    <button className="btn btn-lg btn-danger rounded-pill shadow-lg fw-bold py-3 px-5 transition-all" onClick={returnToFocus}>
                        <i className="bi bi-arrow-return-left me-2"></i> Lock Screen & Resume Focus
                    </button>
                    <button className="btn btn-outline-secondary rounded-pill border-0 mt-3" onClick={abandonSession}>
                        Abandon Session
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FocusViolationOverlay;
