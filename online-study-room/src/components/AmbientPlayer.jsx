import React, { useState, useRef, useEffect } from 'react';

const AMBIENT_TRACKS = [
    { id: 'none', label: 'No Audio', icon: 'bi-volume-mute', url: '' },
    { id: 'rain', label: 'Rainstorms', icon: 'bi-cloud-rain-fill', url: '/sounds/rain.ogg' },
    { id: 'ocean', label: 'Ocean Waves', icon: 'bi-water', url: '/sounds/ocean.ogg' },
    { id: 'brown', label: 'Deep Focus (Brown Noise)', icon: 'bi-earbuds', url: '/sounds/brown.ogg' }
];

const AmbientPlayer = () => {
    const [currentTrack, setCurrentTrack] = useState(AMBIENT_TRACKS[0]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [isOpen, setIsOpen] = useState(false);
    const audioRef = useRef(null);

    useEffect(() => {
        if (!audioRef.current) return;
        
        audioRef.current.volume = volume;
        
        if (currentTrack.id === 'none') {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.src = currentTrack.url;
            if (isPlaying) {
                audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
            }
        }
    }, [currentTrack]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    const togglePlay = () => {
        if (currentTrack.id === 'none') return;
        
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div 
            className="position-fixed z-3 p-3 glass-panel rounded-4 transition-all"
            style={{
                left: '20px',
                bottom: '20px',
                width: isOpen ? '300px' : 'fit-content',
                border: '1px solid rgba(129, 140, 248, 0.3)',
                boxShadow: isPlaying ? '0 0 20px rgba(129,140,248,0.2)' : ''
            }}
        >
            <audio ref={audioRef} loop />
            
            <div className="d-flex align-items-center justify-content-between">
                <div 
                    className="d-flex align-items-center cursor-pointer"
                    onClick={() => setIsOpen(!isOpen)}
                    style={{ cursor: 'pointer' }}
                >
                    <div 
                        className={`rounded-circle d-flex align-items-center justify-content-center me-2 ${isPlaying ? 'bg-primary' : 'bg-secondary bg-opacity-25'}`}
                        style={{ width: '40px', height: '40px', transition: 'all 0.3s' }}
                    >
                        <i className={`bi ${currentTrack.icon} ${isPlaying ? 'text-white' : 'text-secondary'} fs-5`}></i>
                    </div>
                    {isOpen && (
                        <div>
                            <span className="text-white fw-bold d-block lh-1" style={{ fontSize: '0.9rem' }}>Ambient Focus</span>
                            <span className="text-primary small fw-semibold" style={{ fontSize: '0.75rem' }}>{currentTrack.label}</span>
                        </div>
                    )}
                </div>

                {isOpen && (
                    <div className="d-flex gap-2 ms-auto">
                        <button 
                            className={`btn btn-sm ${isPlaying ? 'btn-outline-warning' : 'btn-outline-success'} rounded-circle`}
                            style={{ width: '32px', height: '32px', padding: 0 }}
                            onClick={togglePlay}
                            disabled={currentTrack.id === 'none'}
                        >
                            <i className={`bi ${isPlaying ? 'bi-pause-fill' : 'bi-play-fill'}`}></i>
                        </button>
                    </div>
                )}
            </div>

            {isOpen && (
                <div className="mt-3 pt-3 border-top border-secondary border-opacity-50 animation-fade-in">
                    <label className="text-secondary small fw-bold mb-2">SOUNDSCAPE</label>
                    <select 
                        className="form-select form-select-sm premium-input mb-3"
                        value={currentTrack.id}
                        onChange={(e) => {
                            const track = AMBIENT_TRACKS.find(t => t.id === e.target.value);
                            setCurrentTrack(track);
                            if (track.id !== 'none' && !isPlaying) setIsPlaying(true);
                        }}
                    >
                        {AMBIENT_TRACKS.map(t => (
                            <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                    </select>

                    <label className="text-secondary small fw-bold mb-1 d-flex justify-content-between">
                        <span>VOLUME</span>
                        <span>{Math.round(volume * 100)}%</span>
                    </label>
                    <input 
                        type="range" 
                        className="form-range" 
                        min="0" max="1" step="0.05"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        disabled={currentTrack.id === 'none'}
                    />
                </div>
            )}
        </div>
    );
};

export default AmbientPlayer;
