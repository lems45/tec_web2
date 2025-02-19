import { WebSocketServer } from "ws"; // ✅ Importación correcta en ES Modules

const wss = new WebSocketServer({ port: 8081 }); // ✅ Ahora funcionará correctamente

let clients = [];

wss.on('connection', (ws) => {
    console.log('Cliente WebSocket conectado');
    clients.push(ws);

    ws.on('close', () => {
        clients = clients.filter(client => client !== ws);
        console.log('Cliente WebSocket desconectado');
    });
});

// Función para enviar datos a todos los clientes conectados
export const broadcastData = (data) => {
    clients.forEach(client => {
        if (client.readyState === ws.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};

export { wss };
