import React from 'react';
import { Container, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './PrivacyPolicyPage.css';

const PrivacyPolicyPage = () => {
    return (
        <Container className="privacy-policy-container">
            <Card className="privacy-policy-card p-4 p-md-5">
                <h2 className="privacy-policy-title mb-3">Política de Privacidad de GasControl</h2>
                <p className="privacy-policy-last-updated mb-4"><strong>Última actualización:</strong> 10 de julio de 2025</p>
                <p className="privacy-policy-intro mb-4">En GasControl, respetamos tu privacidad y nos comprometemos a proteger tu información personal. Esta política de privacidad explica cómo recopilamos, utilizamos y compartimos tu información cuando utilizas nuestra aplicación.</p>

                <section className="mb-4">
                    <h5 className="privacy-policy-section-title mb-3">1. Información que Recopilamos</h5>
                    <p className="privacy-policy-section-content">Recopilamos la información que nos proporcionas directamente al registrarte, incluyendo tu nombre, correo electrónico y la URL de tu foto de perfil (opcional).</p>
                </section>

                <section className="mb-4">
                    <h5 className="privacy-policy-section-title mb-3">2. Cómo Usamos tu Información</h5>
                    <p className="privacy-policy-section-content">Usamos tu información para:</p>
                    <ul className="privacy-policy-list mt-2">
                        <li>Crear y gestionar tu cuenta de usuario.</li>
                        <li>Asociar los pedidos que registras con tu perfil.</li>
                        <li>Mejorar la funcionalidad y seguridad de nuestro servicio.</li>
                    </ul>
                </section>

                <section className="mb-4">
                    <h5 className="privacy-policy-section-title mb-3">3. Seguridad de los Datos</h5>
                    <p className="privacy-policy-section-content">Tu contraseña se almacena de forma encriptada y segura. Empleamos las mejores prácticas de seguridad para proteger tus datos contra accesos no autorizados.</p>
                </section>

                <div className="text-center mt-5">
                    <Link to="/" className="btn btn-secondary">Volver al Inicio</Link>
                </div>
            </Card>
        </Container>
    );
};

export default PrivacyPolicyPage;