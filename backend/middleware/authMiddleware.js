const admin = require('firebase-admin');

const verifyAuthToken = async (req, res, next) => {
  // El token vendrá en el encabezado 'Authorization' como 'Bearer <token>'
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send({ message: 'No autorizado. Token no proporcionado.' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    // Verificar el token con Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken; // Añadimos los datos del usuario a la solicitud
    next(); // El token es válido, continuar a la siguiente función
  } catch (error) {
    console.error('Error al verificar el token:', error);
    return res.status(403).send({ message: 'Token inválido o expirado.' });
  }
};

module.exports = { verifyAuthToken };