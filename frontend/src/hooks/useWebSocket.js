import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const useWebSocket = (namespace, options = {}) => {
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // If VITE_API_URL is not set, default to window.location.origin (for production/ingress)
        // instead of localhost:5000 which breaks when accessing via domain.
        const socketUrl = import.meta.env.VITE_API_URL || window.location.origin;
        // If VITE_API_URL is relative (like /api), we need to construct full URL for socket.io
        // But usually socket.io client handles relative paths if on same origin.
        // Since we proxy, we can point to window.location.origin + namespace?
        // Or just let proxy handle it.

        // If it's a relative path (like '/api'), prepend origin, though socket.io usually handles it.
        // But for safety with namespaces:
        const url = socketUrl.startsWith('http') ? socketUrl : window.location.origin;

        const instance = io(`${url}${namespace}`, {
            path: '/socket.io',
            transports: ['websocket'],
            ...options
        });

        setSocket(instance);

        return () => {
            instance.disconnect();
            setSocket(null);
        };
    }, [namespace]);

    return socket;
};

export default useWebSocket;
