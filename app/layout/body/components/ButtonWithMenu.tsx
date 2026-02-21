'use client';

import React, { useEffect, useRef, useState } from 'react';
import { GameConfig, GameMode } from '@/app/utils/types';

interface ButtonWithMenuProps {
    config: GameConfig;
    mode: GameMode;
    label: string;
    value?: number;
    handleModeChange: (mode: GameMode) => void;
    handleChange: (value: number) => void;
    options: readonly number[];
}

const ButtonWithMenu: React.FC<ButtonWithMenuProps> = ({
    config,
    mode,
    label,
    value,
    handleModeChange,
    handleChange,
    options,
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };

        if (showMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showMenu]);

    return (
        <div className="relative" ref={menuRef}>
            <button
                className={`hover:text-yellow-400 transition-colors ${config.mode === mode ? 'text-yellow-400' : ''
                    }`}
                onClick={() => {
                    handleModeChange(mode);
                    setShowMenu(!showMenu);
                }}
            >
                {label} {value && `(${value})`}
            </button>

            {showMenu && config.mode === mode && (
                <div className="absolute top-full left-0 mt-2 bg-gray-800 border border-gray-700 rounded shadow-lg z-10 min-w-[80px]">
                    {options.map((option) => (
                        <button
                            key={option}
                            className={`block w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors ${value === option
                                    ? 'text-yellow-400 bg-gray-700'
                                    : 'text-gray-300'
                                }`}
                            onClick={() => {
                                handleChange(option);
                                setShowMenu(false);
                            }}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ButtonWithMenu;