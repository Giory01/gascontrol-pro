import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAuth, signOut } from 'firebase/auth';
import api from '../api';
import { toast } from 'react-toastify';
import { Navbar, Container, Button, Table, Spinner, Card, Modal, Form, ListGroup, Badge, NavDropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaBars } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import useIdleTimer from '../hooks/useIdleTimer';
import './FiadosPage.css';

const FiadosPage = () => {
    const { currentUser } = useAuth();
    const [deudores, setDeudores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showSidebar, setShowSidebar] = useState(false);
    const [showPagoModal, setShowPagoModal] = useState(false);
    const [showHistorialModal, setShowHistorialModal] = useState(false);
    const [selectedDeudor, setSelectedDeudor] = useState(null);
    const [montoPago, setMontoPago] = useState('');
    const auth = getAuth();

    const handleIdle = useCallback(() => {
        signOut(auth).then(() => {
            toast.warn("Tu sesión ha expirado por inactividad.");
        });
    }, [auth]);
    useIdleTimer(handleIdle);

    const fetchDeudores = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const token = await currentUser.getIdToken();
            const response = await api.get('/api/fiados', { headers: { Authorization: `Bearer ${token}` } });
            setDeudores(response.data);
        } catch (error) {
            toast.error("Error al cargar la lista de deudores.");
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchDeudores();
    }, [fetchDeudores]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast.info("Has cerrado sesión. ¡Vuelve pronto!");
        } catch (error) {
            toast.error('Error al cerrar sesión.');
        }
    };

    const handleOpenPagoModal = (deudor) => {
        setSelectedDeudor(deudor);
        setMontoPago('');
        setShowPagoModal(true);
    };

    const handleOpenHistorialModal = (deudor) => {
        setSelectedDeudor(deudor);
        setShowHistorialModal(true);
    };

    const handleCloseModals = () => {
        setShowPagoModal(false);
        setShowHistorialModal(false);
        setSelectedDeudor(null);
    };

    const handleRegistrarPago = async (e) => {
        e.preventDefault();
        const monto = parseFloat(montoPago);
        if (!selectedDeudor || !monto || monto <= 0) {
            return toast.error("Por favor, ingresa un monto válido.");
        }

        try {
            const token = await currentUser.getIdToken();
            await api.post(`/api/fiados/${selectedDeudor.id}/pagar`, { montoPagado: monto }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("¡Pago registrado con éxito!");
            handleCloseModals();
            fetchDeudores();
        } catch (error) {
            toast.error("Error al registrar el pago.");
        }
    };

    return (
        <>
            <Sidebar show={showSidebar} handleClose={() => setShowSidebar(false)} />
            <Navbar className="dashboard-navbar mb-4">
                 <Container fluid>
                    <Button variant="light" onClick={() => setShowSidebar(true)} className="me-2"><FaBars /></Button>
                    <Navbar.Brand href="/dashboard">Control de Fiados</Navbar.Brand>
                    <Navbar.Collapse className="justify-content-end">
                        <NavDropdown 
                            title={<img src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.displayName || 'G'}`} alt="perfil" width="30" height="30" className="d-inline-block align-top rounded-circle" />} 
                            id="basic-nav-dropdown" 
                            align="end"
                        >
                            <NavDropdown.Item as={Link} to="/perfil">Mi Perfil</NavDropdown.Item>
                            <NavDropdown.Divider />
                            <NavDropdown.Item onClick={handleLogout}>Cerrar Sesión</NavDropdown.Item>
                        </NavDropdown>
                    </Navbar.Collapse>
                 </Container>
            </Navbar>
            <Container>
                {loading ? <div className="text-center py-5"><Spinner /></div> : deudores.length === 0 ? <Card className="text-center p-4 mt-4"><Card.Body><Card.Title>¡Felicidades!</Card.Title><Card.Text>No tienes ningún cliente con deudas pendientes.</Card.Text></Card.Body></Card> : (
                    <Table striped bordered hover responsive className="fiados-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Nombre del Cliente</th>
                                <th className="text-center">Deuda Total</th>
                                <th className="text-center">Última Actualización</th>
                                <th className="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deudores.map((deudor, index) => (
                                <tr key={deudor.id}>
                                    <td>{index + 1}</td>
                                    <td>{deudor.clienteNombre}</td>
                                    <td className="text-center deuda-total">${deudor.deudaTotal.toFixed(2)}</td>
                                    <td className="text-center">{new Date(deudor.ultimaActualizacion._seconds * 1000).toLocaleDateString()}</td>
                                    <td className="text-center">
                                        <Button variant="success" size="sm" className="me-2" onClick={() => handleOpenPagoModal(deudor)}>Registrar Pago</Button>
                                        <Button variant="secondary" size="sm" onClick={() => handleOpenHistorialModal(deudor)}>Ver Historial</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </Container>
            {selectedDeudor && (
                <>
                    <Modal show={showPagoModal} onHide={handleCloseModals} centered>
                        <Modal.Header closeButton><Modal.Title>Registrar Pago para {selectedDeudor.clienteNombre}</Modal.Title></Modal.Header>
                        <Modal.Body>
                            <p>Deuda actual: <strong className="deuda-total">${selectedDeudor.deudaTotal.toFixed(2)}</strong></p>
                            <Form onSubmit={handleRegistrarPago}>
                                <Form.Group>
                                    <Form.Label>Monto a Pagar</Form.Label>
                                    <Form.Control type="number" placeholder="0.00" value={montoPago} onChange={(e) => setMontoPago(e.target.value)} min="0.01" step="0.01" required autoFocus />
                                </Form.Group>
                                <Button variant="primary" type="submit" className="w-100 mt-3">Confirmar Pago</Button>
                            </Form>
                        </Modal.Body>
                    </Modal>
                    <Modal show={showHistorialModal} onHide={handleCloseModals} centered size="lg">
                        <Modal.Header closeButton><Modal.Title>Historial de Deuda de {selectedDeudor.clienteNombre}</Modal.Title></Modal.Header>
                        <Modal.Body>
                            <ListGroup>
                                {selectedDeudor.historialPedidos.sort((a, b) => b.fecha._seconds - a.fecha._seconds).map((item, index) => (
                                    <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                                        <div>
                                            <strong>{item.tipo === 'Abono' ? 'ABONO REALIZADO' : `Pedido Fiado`}</strong><br/>
                                            <span className="text-muted small">{new Date(item.fecha._seconds * 1000).toLocaleString()}</span>
                                        </div>
                                        <Badge bg={item.monto > 0 ? 'warning' : 'success'} text={item.monto > 0 ? 'dark' : 'white'} pill>
                                            {item.monto > 0 ? `+$${item.monto.toFixed(2)}` : `-$${Math.abs(item.monto).toFixed(2)}`}
                                        </Badge>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                            <h4 className="text-end mt-3">Saldo Final: <span className="deuda-total">${selectedDeudor.deudaTotal.toFixed(2)}</span></h4>
                        </Modal.Body>
                    </Modal>
                </>
            )}
        </>
    );
};

export default FiadosPage;