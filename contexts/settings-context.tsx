import React, { createContext, useState, useContext, ReactNode } from 'react';

interface Settings {
    useCmdEnterToSend: boolean;
    // Add other settings as needed
}

interface SettingsContextType {
    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<Settings>({
        useCmdEnterToSend: false,
        // Initialize other settings here
    });

    const updateSettings = (newSettings: Partial<Settings>) => {
        setSettings(prevSettings => ({
            ...prevSettings,
            ...newSettings
        }));
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}