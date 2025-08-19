import React, { useState } from 'react'; // Se añadió 'useState'
import { Container, Card, Button, Row, Col, ListGroup, Navbar } from 'react-bootstrap';
import { FaCheckCircle, FaStar, FaBars } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import { toast } from 'react-toastify';
import './PricingPage.css';

const PricingPage = () => {
    const [showSidebar, setShowSidebar] = useState(false);

    const handleSelectPlan = (planName) => {
        toast.info(`Has seleccionado el Plan ${planName}. ¡Gracias por tu interés! Esta función estará disponible próximamente.`);
    };

    return (
        <>
            <Sidebar show={showSidebar} handleClose={() => setShowSidebar(false)} />
            <Navbar className="dashboard-navbar mb-4">
                 <Container fluid>
                    <Button variant="light" onClick={() => setShowSidebar(true)} className="me-2">
                        <FaBars />
                    </Button>
                    <Navbar.Brand href="#" className="dashboard-brand">
                        Planes y Precios
                    </Navbar.Brand>
                 </Container>
            </Navbar>

            <Container className="pricing-container">
                <div className="text-center mb-5">
                    <h2>Elige el Plan Perfecto para tu Negocio</h2>
                    <p className="lead text-muted">Comienza gratis y escala a medida que tu operación crece.</p>
                </div>
                <Row>
                    {/* Plan Básico */}
                    <Col md={4} className="mb-4">
                        <Card className="pricing-card">
                            <Card.Header><h4 className="plan-title">Básico</h4></Card.Header>
                            <Card.Body>
                                <h2 className="plan-price">Gratis</h2>
                                <ListGroup variant="flush" className="plan-features text-start">
                                    <ListGroup.Item><FaCheckCircle className="icon-check" /> Pedidos Ilimitados</ListGroup.Item>
                                    <ListGroup.Item><FaCheckCircle className="icon-check" /> Control de Fiados</ListGroup.Item>
                                    <ListGroup.Item><FaCheckCircle className="icon-check" /> Reportes (Últimos 7 días)</ListGroup.Item>
                                </ListGroup>
                            </Card.Body>
                            <Card.Footer>
                                <Button variant="outline-primary" className="w-100" disabled>Plan Actual</Button>
                            </Card.Footer>
                        </Card>
                    </Col>

                    {/* Plan Pro */}
                    <Col md={4} className="mb-4">
                        <Card className="pricing-card recommended">
                            <Card.Header><h4 className="plan-title">Pro</h4></Card.Header>
                            <Card.Body>
                                <h2 className="plan-price">$199<span className="period">/mes</span></h2>
                                <ListGroup variant="flush" className="plan-features text-start">
                                    <ListGroup.Item><FaCheckCircle className="icon-check" /> Todo lo del Plan Básico</ListGroup.Item>
                                    <ListGroup.Item><FaStar className="icon-star" /> <strong>Mapa con Optimización de Ruta</strong></ListGroup.Item>
                                    <ListGroup.Item><FaStar className="icon-star" /> <strong>Reportes Históricos Ilimitados</strong></ListGroup.Item>
                                    <ListGroup.Item><FaStar className="icon-star" /> <strong>Exportar Reportes a PDF/Excel</strong></ListGroup.Item>
                                </ListGroup>
                            </Card.Body>
                            <Card.Footer>
                                <Button variant="primary" className="w-100" onClick={() => handleSelectPlan('Pro')}>Seleccionar Plan Pro</Button>
                            </Card.Footer>
                        </Card>
                    </Col>

                    {/* Plan Business */}
                    <Col md={4} className="mb-4">
                        <Card className="pricing-card">
                            <Card.Header><h4 className="plan-title">Business</h4></Card.Header>
                            <Card.Body>
                                <h2 className="plan-price">$499<span className="period">/mes</span></h2>
                                <ListGroup variant="flush" className="plan-features text-start">
                                    <ListGroup.Item><FaCheckCircle className="icon-check" /> Todo lo del Plan Pro</ListGroup.Item>
                                    <ListGroup.Item><FaStar className="icon-star" /> <strong>Soporte para Múltiples Repartidores</strong></ListGroup.Item>
                                    <ListGroup.Item><FaStar className="icon-star" /> <strong>Panel de Administrador</strong></ListGroup.Item>
                                </ListGroup>
                            </Card.Body>
                            <Card.Footer>
                                <Button variant="outline-primary" className="w-100" onClick={() => handleSelectPlan('Business')}>Contactar</Button>
                            </Card.Footer>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    );
};

export default PricingPage;