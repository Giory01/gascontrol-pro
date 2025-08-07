import React, { useContext, useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

const AuthContext = React.createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const auth = getAuth();
        // Esta función de Firebase es un 'oyente' que se activa
        // cada vez que el estado de autenticación cambia (login/logout)
        const unsubscribe = onAuthStateChanged(auth, user => {
            setCurrentUser(user);
            setLoading(false);
        });

        return unsubscribe; // Se desuscribe del oyente cuando el componente se desmonta
    }, []);

    const value = {
        currentUser
    };

    // No renderizamos la app hasta que Firebase haya verificado el estado del usuario
    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}