import { useState, useEffect, useRef } from 'react';

const useWebSocket = (url) => {
    const [data, setData] = useState(null);
    const socketRef = useRef(null);

    useEffect(() => {
        const connect = () => {
            socketRef.current = new WebSocket(url);

            socketRef.current.onmessage = (event) => {
                const parsedData = JSON.parse(event.data);
                console.log("📡 Datos recibidos desde WebSocket:", parsedData); // 👈 Agrega este log
                setData(parsedData);
            };

            socketRef.current.onclose = () => {
                console.log("⚠️ WebSocket desconectado, intentando reconectar...");
                setTimeout(connect, 2000);
            };
        };

        connect();

        return () => socketRef.current.close();
    }, [url]);

    return data;
};

export default useWebSocket;
