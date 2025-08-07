import React, { useState } from 'react';
// CORRECCIÓN: Se eliminó 'Alert' de esta línea porque ya no se usa.
import { Form, Button, Card, Spinner } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './AuthPage.css';

// Se añaden setPersistence y browserSessionPersistence
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, setPersistence, browserSessionPersistence } from "firebase/auth";
import firebaseConfig from '../firebaseConfig';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// --- Componente del Formulario de Login ---
const LoginForm = ({ onSwitch }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            return toast.error("Por favor, completa todos los campos.");
        }
        setLoading(true);

        try {
            await setPersistence(auth, browserSessionPersistence);
            await signInWithEmailAndPassword(auth, email, password);
            toast.success("¡Inicio de sesión exitoso!");
            navigate('/dashboard');
        } catch (err) {
            toast.error("Error: Correo o contraseña incorrectos.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3" controlId="loginEmail">
                <Form.Label>Correo Electrónico</Form.Label>
                <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Form.Group>
            <Form.Group className="mb-4" controlId="loginPassword">
                <Form.Label>Contraseña</Form.Label>
                <div className="password-input-group">
                    <Form.Control type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <Button variant="outline-secondary" onClick={() => setShowPassword(!showPassword)} className="password-toggle-button">{showPassword ? 'Ocultar' : 'Ver'}</Button>
                </div>
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100" disabled={loading}>
                {loading ? <Spinner as="span" animation="border" size="sm" /> : 'Iniciar Sesión'}
            </Button>
        </Form>
    );
};


// --- Componente del Formulario de Registro ---
const RegisterForm = ({ onSwitch }) => {
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [profilePictureUrl, setProfilePictureUrl] = useState('');
    const [privacyPolicyAccepted, setPrivacyPolicyAccepted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!nombre || !email || !password) {
            return toast.error("Por favor, completa todos los campos obligatorios.");
        }
        if (!privacyPolicyAccepted) {
            return toast.warn("Debes aceptar la Política de Privacidad para continuar.");
        }
        if (password.length < 6) {
            return toast.warn("La contraseña debe tener al menos 6 caracteres.");
        }
        setLoading(true);

        try {
            await axios.post('http://localhost:5000/api/auth/register', {
                nombre, email, password, profilePictureUrl
            });
            toast.success('¡Registro exitoso! Por favor, inicia sesión para continuar.');
            onSwitch();
        } catch (err) {
            let errorMessage = "Ocurrió un error inesperado.";
            if (err.response && err.response.data) {
                errorMessage = err.response.data.errors ? err.response.data.errors[0].msg : err.response.data.message;
            } else {
                errorMessage = "No se pudo conectar con el servidor.";
            }
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <Form onSubmit={handleRegister}>
            <Form.Group className="mb-3">
                <Form.Label>Nombre Completo</Form.Label>
                <Form.Control type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </Form.Group>
            <Form.Group className="mb-3">
                <Form.Label>Correo Electrónico</Form.Label>
                <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Form.Group>
            <Form.Group className="mb-3">
                <Form.Label>Contraseña</Form.Label>
                <div className="password-input-group">
                    <Form.Control type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <Button variant="outline-secondary" onClick={() => setShowPassword(!showPassword)} className="password-toggle-button">{showPassword ? 'Ocultar' : 'Ver'}</Button>
                </div>
            </Form.Group>
            <Form.Group className="mb-4">
                <Form.Label>URL de Foto de Perfil (Opcional)</Form.Label>
                <Form.Control type="url" placeholder="https://ejemplo.com/foto.jpg" value={profilePictureUrl} onChange={(e) => setProfilePictureUrl(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3" controlId="privacyPolicyCheck">
                <Form.Check 
                    type="checkbox"
                    checked={privacyPolicyAccepted}
                    onChange={(e) => setPrivacyPolicyAccepted(e.target.checked)}
                    label={
                        <>
                            He leído y acepto la <Link to="/privacy" target="_blank" rel="noopener noreferrer">Política de Privacidad</Link>.
                        </>
                    }
                    required
                />
            </Form.Group>
            <Button variant="primary" type="submit" className="w-100" disabled={loading}>
                {loading ? <Spinner as="span" animation="border" size="sm" /> : 'Crear Cuenta'}
            </Button>
        </Form>
    );
};


// --- Componente Principal ---
const AuthPage = () => {
    const [isLoginView, setIsLoginView] = useState(true);

    const switchView = () => setIsLoginView(!isLoginView);

    return (
        <Card className="auth-card">
            <Card.Body>
                <h2 className="auth-title">GasControl</h2>
                <h3 className="auth-subtitle">{isLoginView ? 'Iniciar Sesión' : 'Crear Cuenta'}</h3>
                
                {isLoginView ? <LoginForm onSwitch={switchView} /> : <RegisterForm onSwitch={switchView} />}
                
                <div className="auth-switch-link" onClick={switchView}>
                    {isLoginView ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes una cuenta? Inicia Sesión'}
                </div>
            </Card.Body>
        </Card>
    );
};

export default AuthPage;