import React, { useState, useRef, useEffect } from 'react';

const PremiumSelect = ({ options, value, onChange, placeholder = "Select an option", style }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef(null);

    // Close when clicking outside of the custom select component
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectRef.current && !selectRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (val) => {
        onChange(val);
        setIsOpen(false);
    };

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className="position-relative" ref={selectRef} style={style}>
            <div 
                className={`form-control premium-input d-flex justify-content-between align-items-center`}
                onClick={() => setIsOpen(!isOpen)}
                style={{ 
                    cursor: 'pointer', 
                    borderColor: isOpen ? '#818cf8' : '',
                    boxShadow: isOpen ? '0 0 0 4px rgba(129, 140, 248, 0.2)' : ''
                }}
            >
                <span className={!selectedOption ? "text-secondary" : "text-white"}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} text-secondary transition`}></i>
            </div>
            
            {isOpen && (
                <div 
                    className="position-absolute w-100 mt-2 glass-panel p-2 shadow-lg z-3"
                    style={{ 
                        animation: 'fadeIn 0.2s ease-out',
                        maxHeight: '220px',
                        overflowY: 'auto',
                        border: '1px solid rgba(129, 140, 248, 0.4)',
                        background: 'rgba(15, 23, 42, 0.95)',
                        backdropFilter: 'blur(20px)'
                    }}
                >
                    {options.map((opt) => {
                        const isSelected = value === opt.value;
                        return (
                            <div 
                                key={opt.value}
                                className={`p-2 rounded-3 mb-1 transition`}
                                onClick={() => handleSelect(opt.value)}
                                style={{ 
                                    cursor: 'pointer',
                                    background: isSelected ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                                    color: isSelected ? '#c084fc' : '#f8fafc',
                                    fontWeight: isSelected ? 'bold' : 'normal'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSelected) {
                                        e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected) {
                                        e.target.style.background = 'transparent';
                                    }
                                }}
                            >
                                {opt.label}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default PremiumSelect;
