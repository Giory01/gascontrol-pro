import { useState, useEffect, useCallback, useRef } from 'react';

const useIdleTimer = (onIdle, idleTime = 30 * 60 * 1000) => { // 30 minutos por defecto
    const [isIdle, setIsIdle] = useState(false);
    const timeoutId = useRef();

    const resetTimer = useCallback(() => {
        if (timeoutId.current) {
            clearTimeout(timeoutId.current);
        }
        setIsIdle(false);
        timeoutId.current = setTimeout(() => {
            setIsIdle(true);
            onIdle(); // Ejecutar la función de logout
        }, idleTime);
    }, [idleTime, onIdle]);

    const handleEvent = useCallback(() => {
        resetTimer();
    }, [resetTimer]);

    useEffect(() => {
        const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];

        // Iniciar el temporizador al montar el componente
        resetTimer();

        // Añadir los listeners de eventos
        events.forEach(event => window.addEventListener(event, handleEvent));

        // Limpiar al desmontar el componente
        return () => {
            clearTimeout(timeoutId.current);
            events.forEach(event => window.removeEventListener(event, handleEvent));
        };
    }, [resetTimer, handleEvent]);

    return isIdle;
};

export default useIdleTimer;