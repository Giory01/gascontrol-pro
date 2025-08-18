import React from 'react';
import { Container, Card } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './PrivacyPolicyPage.css';

const PrivacyPolicyPage = () => {
    return (
        <div className="centered-page-container">
            <Container className="privacy-policy-container">
                <Card className="privacy-policy-card p-4 p-md-5">
                    <h2 className="privacy-policy-title mb-3">Política de Privacidad de GasControl Pro</h2>
                    <p className="privacy-policy-last-updated mb-4"><strong>Última actualización:</strong> 18 de agosto de 2025</p>
                    
                    <p className="privacy-policy-intro mb-4">
                        Bienvenido a GasControl Pro. Tu privacidad es de suma importancia para nosotros. Esta política detalla qué información recopilamos, cómo la usamos y cómo la protegemos para asegurar la total confianza en nuestro servicio.
                    </p>

                    <section className="mb-4">
                        <h5 className="privacy-policy-section-title mb-3">1. ¿Qué Información Recopilamos?</h5>
                        <p className="privacy-policy-section-content">Para proporcionar la funcionalidad de GasControl Pro, recopilamos los siguientes datos:</p>
                        <ul className="privacy-policy-list">
                            <li><strong>Información de la Cuenta:</strong> Tu nombre, correo electrónico y contraseña (la cual se almacena de forma segura y encriptada). Opcionalmente, la URL de tu foto de perfil.</li>
                            <li><strong>Datos de Pedidos:</strong> Nombre del cliente, dirección de entrega, coordenadas geográficas (latitud y longitud), detalles del pedido (tamaño y cantidad de cilindros) y el precio total.</li>
                            <li><strong>Datos Financieros:</strong> El tipo de pago de cada pedido ("Contado" o "Fiado") y el historial de deudas y abonos de tus clientes.</li>
                        </ul>
                    </section>

                    <section className="mb-4">
                        <h5 className="privacy-policy-section-title mb-3">2. ¿Cómo Usamos tu Información?</h5>
                        <p className="privacy-policy-section-content">Utilizamos tus datos exclusivamente para potenciar las funcionalidades de la aplicación y mejorar tu negocio:</p>
                        <ul className="privacy-policy-list">
                            <li>Para **gestionar tus pedidos** y mostrarlos en el dashboard y en el mapa.</li>
                            <li>Para **calcular las rutas de entrega más eficientes** utilizando las coordenadas guardadas.</li>
                            <li>Para **llevar un control automático de las deudas** de los clientes que pagan a crédito ("fiado").</li>
                            <li>Para **generar reportes de rendimiento** que te ayuden a entender tus ventas e ingresos.</li>
                        </ul>
                    </section>

                    <section className="mb-4">
                        <h5 className="privacy-policy-section-title mb-3">3. Nuestro Compromiso con tu Seguridad y Privacidad</h5>
                        <p className="privacy-policy-section-content">Tu confianza es nuestro activo más valioso. Por ello, nos comprometemos a:</p>
                        <ul className="privacy-policy-list">
                            <li><strong>No Vender tus Datos:</strong> Jamás venderemos, alquilaremos o compartiremos tu información personal o la de tu negocio con terceros para fines de marketing.</li>
                            <li><strong>Seguridad Robusta:</strong> Utilizamos las mejores prácticas de la industria y los servicios seguros de Google Firebase para almacenar y proteger tu información contra accesos no autorizados.</li>
                            <li><strong>Transparencia:</strong> Esta política siempre estará actualizada para reflejar nuestras prácticas de manejo de datos.</li>
                        </ul>
                    </section>

                    <div className="text-center mt-5">
                        <Link to="/" className="btn btn-secondary">Volver al Inicio</Link>
                    </div>
                </Card>
            </Container>
        </div>
    );
};

export default PrivacyPolicyPage;