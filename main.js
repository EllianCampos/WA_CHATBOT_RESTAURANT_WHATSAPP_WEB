// The token is used to avoid that anybody could use the API
const TOKEN = 'my-secret-token';

// Backend where to send the messages 
const BACKEND_WEB_HOOK = "https://localhost:7190/api/whatsappweb/get-from-wa"

// Port to run the app
const PORT = 3000;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const express = require('express');
const app = express();

const { Client, LocalAuth, List } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

app.use(express.json());

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Escanea el código QR con WhatsApp');
});

client.on('ready', () => {
    console.log('Cliente conectado');
});

// Ejemplo: Escuchar mensajes
client.on('message', async (message) => {
    const phone = message?.from.split("@")[0]
    const body = message.body
    const userName = message._data.notifyName

    if (message.type !== 'chat'){
        return enviarMensaje(phone, 'ESTE TIPO DE MENSJAES AÚN NO ES SOPORTADO: por favor escribe')
    }
 
    fetch(BACKEND_WEB_HOOK, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json",
            "authorization": TOKEN
        },
        body: JSON.stringify({
            phone: phone,
            username: userName,
            message: body
        })
    })
    .catch(error => {
        enviarMensaje(phone, "Lo sentimos actualmente el chatbot se encuentra fuera de servicio")
        console.log("There was an error sending the message to the backend: " + error)
    })
});

// Ejemplo: Función para enviar mensaje
async function enviarMensaje(numero, mensaje) {
    const chatId = numero.includes('@c.us') ? numero : `${numero}@c.us`;
    await client.sendMessage(chatId, mensaje);
}

app.post('/send', (req, res) => {
    try{
        // Validate token
        const token = req.headers['authorization'];
        if (!token || token !== TOKEN) {
            return res.status(403).json({ error: 'Unauthorized: Invalid token' });
        }

        // Validate data
        const { number, message } = req.body;
        if (!number || !message) {
            return res.status(400).json({ error: 'number and message are required' });
        }
    
        enviarMensaje(number, message)
        return res.status(204).json();
    } catch{
        return res.status(500).json()
    }
});

// app.get('/test', (req, res) => {
//     console.log('1')
//     const options = new List(
//         "¿Que deseas ordenar?",
//         "Ver el menú",
//         [
//             {
//                 title: "Productos",
//                 rows: [
//                     { id: "apple", title: "Apple" },
//                     { id: "mango", title: "Mango" },
//                     { id: "banana", title: "Banana" },
//                 ]
//             }
//         ],
//         "Please select a product"
//     )
//     console.log('2')
//     enviarMensaje('50683458718', options)
//     console.log('3')
// })

app.get('/', (req, res) => res.status(200).json({ online: true }))

client.initialize();
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));





































// const express = require('express');
// const { Client } = require('whatsapp-web.js');
// const qrcode = require('qrcode-terminal');

// const app = express();
// const port = 8000;

// const client = new Client({
//     puppeteer: {
//         headless: true,
//         args: ['--no-sandbox', '--disable-setuid-sandbox']
//     }
// });

// client.on('qr', (qr) => {
//     qrcode.generate(qr, { small: true });
// });

// client.on('ready', () => {
//     console.log('Client is ready!');
// });

// client.on('message', msg => {
//     if (msg.body === 'ping') {
//         msg.reply('pong');
//     }
// });

// client.initialize();

// app.get('/', (req, res) => {
//     res.send('WhatsApp Web is running!');
// });

// app.listen(port, () => {
//     console.log(`App listening at http://localhost:${port}`);
// });