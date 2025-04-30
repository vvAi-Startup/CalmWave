import React, { createContext, useState, ReactNode, useContext } from 'react';

type NavContextType = {
    selecionado: 'home' | 'audio' | 'config';
    setSelecionado: (value: 'home' | 'audio' | 'config') => void;
};

export const NavContext = createContext<NavContextType | undefined>(undefined);

export const NavProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [selecionado, setSelecionado] = useState<'home' | 'audio' | 'config'>('home');

    return (
        <NavContext.Provider value={{ selecionado, setSelecionado }}>
            {children}
        </NavContext.Provider>
    );
};

// Hook personalizado para usar o contexto
export const useNavContext = (): NavContextType => {
    const context = useContext(NavContext);
    if (!context) {
        throw new Error('useNavContext must be used within a NavProvider');
    }
    return context;
};