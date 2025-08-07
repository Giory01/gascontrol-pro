// Cargar variables de entorno desde el archivo .env
require('dotenv').config();

// --- Importaciones de Módulos ---
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { verifyAuthToken } = require('./middleware/authMiddleware');

// --- Precios Base ---
const PRECIOS = {
    '10kg': 200,
    '20kg': 400,
    '30kg': 600
};

// --- Configuración de Firebase Segura ---
const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();
console.log('¡Conectado a Firebase correctamente! ✅');

// --- Creación de la Aplicación Express ---
const app = express();

// --- Middlewares de Seguridad y Configuración ---
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Demasiadas solicitudes desde esta IP, por favor intente de nuevo después de 15 minutos'
});
app.use('/api/auth', authLimiter);


// --- Rutas de la Aplicación ---
app.get('/', (req, res) => {
    res.send('El servidor de GasControl Pro está funcionando correctamente.');
});

// --- Rutas de Autenticación ---
app.post('/api/auth/register',
    body('email').isEmail().normalizeEmail().withMessage('Por favor, introduce un correo válido.'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres.'),
    body('nombre').not().isEmpty().trim().escape().withMessage('El nombre es obligatorio.'),
    body('profilePictureUrl').optional({ checkFalsy: true }).isURL().withMessage('El enlace de la foto de perfil no es una URL válida.'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { email, password, nombre, profilePictureUrl } = req.body;
            const newUserPayload = {
                email: email,
                password: password,
                displayName: nombre,
            };
            if (profilePictureUrl) {
                newUserPayload.photoURL = profilePictureUrl;
            }
            const userRecord = await admin.auth().createUser(newUserPayload);
            await db.collection('gaseros').doc(userRecord.uid).set({
                nombre,
                email,
                profilePictureUrl: profilePictureUrl || null,
                fechaCreacion: admin.firestore.FieldValue.serverTimestamp()
            });
            res.status(201).send({ message: 'Usuario registrado exitosamente', uid: userRecord.uid });
        } catch (error) {
            console.error('Error en el registro:', error);
            if (error.code === 'auth/email-already-exists') {
                return res.status(400).send({ message: 'El correo electrónico ya está en uso.' });
            }
            res.status(500).send({ message: 'Ocurrió un error interno en el servidor.' });
        }
    });

// --- Rutas de Pedidos ---
app.post('/api/pedidos', 
    verifyAuthToken,
    body('cliente').not().isEmpty().trim().escape(),
    body('direccion').not().isEmpty().trim().escape(),
    body('tamanoTanque').isIn(['10kg', '20kg', '30kg']),
    body('numeroDeTanques').isInt({ min: 1 }),
    body('tipoPago').isIn(['Contado', 'Fiado']),
    body('geolocation').optional({ checkFalsy: true }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const { cliente, direccion, tamanoTanque, numeroDeTanques, tipoPago, geolocation } = req.body;
            const gaseroId = req.user.uid;

            const precioUnitario = PRECIOS[tamanoTanque];
            const precioTotal = precioUnitario * numeroDeTanques;

            const nuevoPedido = {
                gaseroId,
                cliente,
                direccion,
                tamanoTanque,
                numeroDeTanques,
                geolocation: geolocation || null,
                tipoPago,
                precioTotal,
                estado: 'Pendiente',
                fechaCreacion: admin.firestore.FieldValue.serverTimestamp(),
            };

            const pedidoRef = await db.collection('pedidos').add(nuevoPedido);
            
            if (tipoPago === 'Fiado') {
                const deudasRef = db.collection('deudas');
                const q = deudasRef.where('gaseroId', '==', gaseroId).where('clienteNombre', '==', cliente).limit(1);
                
                await db.runTransaction(async (transaction) => {
                    const deudasSnapshot = await transaction.get(q);
                    
                    if (deudasSnapshot.empty) {
                        const nuevaDeudaRef = db.collection('deudas').doc();
                        transaction.set(nuevaDeudaRef, {
                            gaseroId: gaseroId,
                            clienteNombre: cliente,
                            deudaTotal: precioTotal,
                            ultimaActualizacion: admin.firestore.FieldValue.serverTimestamp(),
                            historialPedidos: [{
                                pedidoId: pedidoRef.id,
                                monto: precioTotal,
                                fecha: new Date(),
                                tipo: 'Deuda'
                            }]
                        });
                    } else {
                        const deudaDoc = deudasSnapshot.docs[0];
                        const deudaActual = deudaDoc.data().deudaTotal;
                        const nuevaDeudaTotal = deudaActual + precioTotal;

                        transaction.update(deudaDoc.ref, {
                            deudaTotal: nuevaDeudaTotal,
                            ultimaActualizacion: admin.firestore.FieldValue.serverTimestamp(),
                            historialPedidos: admin.firestore.FieldValue.arrayUnion({
                                pedidoId: pedidoRef.id,
                                monto: precioTotal,
                                fecha: new Date(),
                                tipo: 'Deuda'
                            })
                        });
                    }
                });
            }

            res.status(201).send({ id: pedidoRef.id, ...nuevoPedido });
        } catch (error) {
            console.error("Error al crear el pedido:", error);
            res.status(500).send({ message: 'Error interno del servidor.' });
        }
});

app.get('/api/pedidos', verifyAuthToken, async (req, res) => {
    try {
        const gaseroId = req.user.uid;
        const pedidosSnapshot = await db.collection('pedidos')
            .where('gaseroId', '==', gaseroId)
            .orderBy('fechaCreacion', 'desc')
            .get();
        if (pedidosSnapshot.empty) {
            return res.status(200).send([]);
        }
        const pedidos = pedidosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).send(pedidos);
    } catch (error) {
        console.error("Error al obtener los pedidos:", error);
        res.status(500).send({ message: 'Error interno del servidor.' });
    }
});

app.patch('/api/pedidos/:id', 
    verifyAuthToken, 
    body('estado').not().isEmpty().withMessage('El estado es requerido.'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        try {
            const pedidoId = req.params.id;
            const nuevoEstado = req.body.estado;
            const gaseroId = req.user.uid;
            const pedidoRef = db.collection('pedidos').doc(pedidoId);
            const doc = await pedidoRef.get();
            if (!doc.exists) {
                return res.status(404).send({ message: 'El pedido no fue encontrado.' });
            }
            if (doc.data().gaseroId !== gaseroId) {
                return res.status(403).send({ message: 'No tienes permiso para modificar este pedido.' });
            }
            await pedidoRef.update({ estado: nuevoEstado });
            res.status(200).send({ message: 'Pedido actualizado exitosamente.' });
        } catch (error) {
            console.error("Error al actualizar el pedido:", error);
            res.status(500).send({ message: 'Error interno del servidor.' });
        }
});

app.get('/api/fiados', verifyAuthToken, async (req, res) => {
    try {
        const gaseroId = req.user.uid;
        const deudasSnapshot = await db.collection('deudas')
            .where('gaseroId', '==', gaseroId)
            .orderBy('ultimaActualizacion', 'desc')
            .get();

        if (deudasSnapshot.empty) {
            return res.status(200).send([]);
        }

        const deudas = deudasSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).send(deudas);

    } catch (error) {
        console.error("Error al obtener las deudas:", error);
        res.status(500).send({ message: 'Error interno del servidor.' });
    }
});

app.post('/api/fiados/:id/pagar',
    verifyAuthToken,
    body('montoPagado').isFloat({ gt: 0 }).withMessage('El monto pagado debe ser un número mayor a cero.'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const deudaId = req.params.id;
            const { montoPagado } = req.body;
            const gaseroId = req.user.uid;
            
            const deudaRef = db.collection('deudas').doc(deudaId);

            await db.runTransaction(async (transaction) => {
                const deudaDoc = await transaction.get(deudaRef);
                if (!deudaDoc.exists) {
                    throw new Error("El registro de deuda no existe.");
                }

                const deudaData = deudaDoc.data();
                if (deudaData.gaseroId !== gaseroId) {
                    throw new Error("No tienes permiso para modificar esta deuda.");
                }

                const deudaActual = deudaData.deudaTotal;
                const nuevaDeudaTotal = deudaActual - montoPagado;

                // --- INICIO DE LA CORRECCIÓN ---
                if (nuevaDeudaTotal <= 0) {
                    // Si la deuda se salda, se elimina el registro del cliente.
                    transaction.delete(deudaRef);
                } else {
                    // Si aún hay deuda, se actualiza.
                    transaction.update(deudaRef, {
                        deudaTotal: nuevaDeudaTotal,
                        ultimaActualizacion: admin.firestore.FieldValue.serverTimestamp(),
                        historialPedidos: admin.firestore.FieldValue.arrayUnion({
                            tipo: 'Abono',
                            monto: -montoPagado,
                            fecha: new Date(),
                            pedidoId: `pago_${Date.now()}`
                        })
                    });
                }
                // --- FIN DE LA CORRECCIÓN ---
            });

            res.status(200).send({ message: 'Pago registrado exitosamente.' });

        } catch (error) {
            console.error("Error al registrar el pago:", error);
            res.status(500).send({ message: 'Error interno del servidor.' });
        }
    }
);

app.get('/api/reportes', verifyAuthToken, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const gaseroId = req.user.uid;

        if (!startDate || !endDate) {
            return res.status(400).send({ message: 'Se requieren fechas de inicio y fin.' });
        }

        const reportesSnapshot = await db.collection('pedidos')
            .where('gaseroId', '==', gaseroId)
            .where('fechaCreacion', '>=', new Date(startDate))
            .where('fechaCreacion', '<=', new Date(endDate))
            .get();

        const reportesData = reportesSnapshot.docs.map(doc => doc.data());
        res.status(200).send(reportesData);

    } catch (error) {
        console.error("Error al obtener datos para reportes:", error);
        res.status(500).send({ message: 'Error interno del servidor.', details: error.message });
    }
});

// --- Iniciar el Servidor ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});