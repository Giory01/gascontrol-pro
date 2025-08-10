import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAuth, signOut } from 'firebase/auth';
import api from '../api';
import { toast } from 'react-toastify';
import { Navbar, Container, Button, Modal, Form, Spinner, Card, Badge, ButtonGroup, Row, Col } from 'react-bootstrap';
import { FaBars } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import PlacesAutocomplete from '../components/PlacesAutocomplete';
import useIdleTimer from '../hooks/useIdleTimer';
import '../Dashboard.css';

const PRECIOS_FRONTEND = {
    '10kg': 200,
    '20kg': 400,
    '30kg': 600
};

const DashboardPage = () => {
    const { currentUser } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);
    const [cliente, setCliente] = useState('');
    const [direccion, setDireccion] = useState('');
    const [tamanoTanque, setTamanoTanque] = useState('20kg');
    const [numeroDeTanques, setNumeroDeTanques] = useState(1);
    const [geolocation, setGeolocation] = useState(null);
    const [tipoPago, setTipoPago] = useState('Contado');
    const [precioTotalModal, setPrecioTotalModal] = useState(PRECIOS_FRONTEND['20kg'] * 1);
    const auth = getAuth();

    const handleIdle = useCallback(() => {
        signOut(auth).then(() => {
            toast.warn("Tu sesión ha expirado por inactividad.");
        });
    }, [auth]);
    useIdleTimer(handleIdle);

    const pedidosVisibles = useMemo(() => pedidos.filter(p => p.estado?.toLowerCase() !== 'cancelado'), [pedidos]);
    const resumenPedidos = useMemo(() => {
        const totalPendientes = pedidosVisibles.filter(p => p.estado?.toLowerCase() === 'pendiente').length;
        const totalEnCamino = pedidosVisibles.filter(p => p.estado?.toLowerCase() === 'en camino').length;
        const totalEntregados = pedidosVisibles.filter(p => p.estado?.toLowerCase() === 'entregado').length;
        return { totalPendientes, totalEnCamino, totalEntregados };
    }, [pedidosVisibles]);

    const fetchPedidos = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const token = await currentUser.getIdToken();
            const response = await api.get('/api/pedidos', { headers: { Authorization: `Bearer ${token}` } });
            setPedidos(response.data);
        } catch (error) {
            toast.error("Error al cargar los pedidos.");
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        if (currentUser) {
            if (location.state?.fromRegistration) {
                toast.success(`¡Bienvenido, ${currentUser.displayName || 'usuario'}!`);
                navigate(location.pathname, { replace: true, state: {} });
            }
            fetchPedidos();
        }
    }, [currentUser, fetchPedidos, location.state, location.pathname, navigate]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast.info("Has cerrado sesión. ¡Vuelve pronto!");
        } catch (error) {
            toast.error('Error al cerrar sesión.');
        }
    };
    
    const calcularPrecioTotalModal = useCallback((tamano, cantidad) => {
        const precioUnitario = PRECIOS_FRONTEND[tamano] || 0;
        const cant = parseInt(cantidad, 10);
        setPrecioTotalModal(precioUnitario * (isNaN(cant) ? 0 : cant));
    }, []);

    const handleCrearPedido = async (e) => {
        e.preventDefault();
        try {
            const token = await currentUser.getIdToken();
            const nuevoPedido = { cliente, direccion, tamanoTanque, numeroDeTanques, geolocation, tipoPago };
            const response = await api.post('/api/pedidos', nuevoPedido, { headers: { Authorization: `Bearer ${token}` } });
            setPedidos(prevPedidos => [response.data, ...prevPedidos]);
            setShowModal(false);
            toast.success("¡Pedido creado exitosamente!");
            setCliente(''); setDireccion(''); setTamanoTanque('20kg');
            setNumeroDeTanques(1); setGeolocation(null); setTipoPago('Contado');
            setPrecioTotalModal(PRECIOS_FRONTEND['20kg'] * 1);
        } catch (error) {
            toast.error("Error al crear el pedido.");
        }
    };

    const handleUpdateEstado = async (pedidoId, nuevoEstado) => {
        try {
            const token = await currentUser.getIdToken();
            await api.patch(`/api/pedidos/${pedidoId}`, { estado: nuevoEstado }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success(`Pedido marcado como "${nuevoEstado}".`);
            setPedidos(prevPedidos => prevPedidos.map(p => p.id === pedidoId ? { ...p, estado: nuevoEstado } : p));
        } catch (error) {
            toast.error("Error al actualizar el estado.");
        }
    };

    const getBadgeVariant = (estado) => {
        switch (estado?.toLowerCase()) {
            case 'entregado': return 'success';
            case 'cancelado': return 'danger';
            case 'en camino': return 'info';
            default: return 'warning';
        }
    };

    const handlePlaceSelect = (place) => {
        setDireccion(place.formatted_address || '');
        if (place.geometry?.location) {
            setGeolocation({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() });
        } else {
            setGeolocation(null);
        }
    };

    return (
        <>
            <Sidebar show={showSidebar} handleClose={() => setShowSidebar(false)} />
            <Navbar className="dashboard-navbar mb-4">
                <Container fluid>
                    <Button variant="light" onClick={() => setShowSidebar(true)} className="me-2"><FaBars /></Button>
                    <Navbar.Brand href="#">GasControl Pro</Navbar.Brand>
                    <Navbar.Collapse className="justify-content-end">
                        <img src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.displayName || 'G'}`} alt="perfil" width="30" height="30" className="d-inline-block align-top rounded-circle me-3" />
                        <Button variant="outline-primary" className="btn-logout" onClick={handleLogout}>Cerrar Sesión</Button>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
            <Container>
                <Card className="mb-4 summary-card">
                    <Card.Body>
                        <Card.Title>Resumen de Hoy</Card.Title>
                        <Row className="text-center mt-3">
                            <Col><div className="summary-number">{resumenPedidos.totalPendientes}</div><div className="summary-label">Pendientes</div></Col>
                            <Col><div className="summary-number">{resumenPedidos.totalEnCamino}</div><div className="summary-label">En Camino</div></Col>
                            <Col><div className="summary-number">{resumenPedidos.totalEntregados}</div><div className="summary-label">Entregados</div></Col>
                        </Row>
                    </Card.Body>
                </Card>
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3>Mis Pedidos Activos</h3>
                    <Button variant="primary" onClick={() => setShowModal(true)}>+ Nuevo Pedido</Button>
                </div>
                <div className="pedidos-list">
                    {loading ? <div className="text-center py-5"><Spinner /></div> : pedidosVisibles.length === 0 ? <Card className="text-center p-4"><Card.Body><Card.Title>No tienes pedidos activos</Card.Title><Card.Text>Haz clic en "+ Nuevo Pedido" para empezar.</Card.Text></Card.Body></Card> : (
                        pedidosVisibles.map(pedido => (
                            <Card key={pedido.id} className={`pedido-card estado-${pedido.estado?.toLowerCase().replace(' ', '')}`}>
                                <div className="pedido-header">
                                    <span className="pedido-cliente">{pedido.cliente}</span>
                                    <Badge pill bg={getBadgeVariant(pedido.estado)} className="badge-estado">{pedido.estado}</Badge>
                                </div>
                                <p className="mb-1"><strong>Dirección:</strong> {pedido.direccion}</p>
                                <p className="mb-1"><strong>Pedido:</strong> {pedido.numeroDeTanques} cilindro(s) de {pedido.tamanoTanque}</p>
                                <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
                                    <span className="fw-bold fs-5">Total: ${pedido.precioTotal}</span>
                                    <Badge bg={pedido.tipoPago === 'Fiado' ? 'danger' : 'primary'}>{pedido.tipoPago}</Badge>
                                </div>
                                {(pedido.estado?.toLowerCase() === 'pendiente' || pedido.estado?.toLowerCase() === 'en camino') && (
                                    <ButtonGroup size="sm" className="mt-3">
                                        {pedido.estado?.toLowerCase() === 'pendiente' && <Button variant="info" onClick={() => handleUpdateEstado(pedido.id, 'En camino')}>Marcar En Camino</Button>}
                                        <Button variant="success" onClick={() => handleUpdateEstado(pedido.id, 'Entregado')}>Marcar Entregado</Button>
                                        <Button variant="danger" onClick={() => handleUpdateEstado(pedido.id, 'Cancelado')}>Cancelar</Button>
                                    </ButtonGroup>
                                )}
                            </Card>
                        ))
                    )}
                </div>
            </Container>
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton><Modal.Title>Registrar Nuevo Pedido</Modal.Title></Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleCrearPedido}>
                        <Form.Group className="mb-3"><Form.Label>Nombre del Cliente</Form.Label><Form.Control type="text" value={cliente} onChange={e => setCliente(e.target.value)} required /></Form.Group>
                        <Form.Group className="mb-3"><Form.Label>Dirección de Entrega</Form.Label><PlacesAutocomplete onPlaceSelect={handlePlaceSelect} /></Form.Group>
                        <Row>
                            <Col>
                                <Form.Group className="mb-3">
                                    <Form.Label>Tamaño</Form.Label>
                                    <Form.Select value={tamanoTanque} onChange={e => { setTamanoTanque(e.target.value); calcularPrecioTotalModal(e.target.value, numeroDeTanques); }}>
                                        <option value="10kg">10 kg</option><option value="20kg">20 kg</option><option value="30kg">30 kg</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group className="mb-3">
                                    <Form.Label>Cantidad</Form.Label>
                                    <Form.Control type="number" value={numeroDeTanques} onChange={e => { setNumeroDeTanques(e.target.value); calcularPrecioTotalModal(tamanoTanque, e.target.value); }} min="1" required />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>Tipo de Pago</Form.Label>
                            <div>
                                <Form.Check inline type="radio" label="Contado" name="tipoPago" value="Contado" checked={tipoPago === 'Contado'} onChange={(e) => setTipoPago(e.target.value)} />
                                <Form.Check inline type="radio" label="Fiado" name="tipoPago" value="Fiado" checked={tipoPago === 'Fiado'} onChange={(e) => setTipoPago(e.target.value)} />
                            </div>
                        </Form.Group>
                        <div className="mt-3 text-end"><h5 className="fw-bold">Total a Pagar: <span className="text-success">${precioTotalModal.toFixed(2)}</span></h5></div>
                        <Button variant="primary" type="submit" className="w-100 mt-3">Guardar Pedido</Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </>
    );
};

export default DashboardPage;