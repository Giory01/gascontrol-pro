import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { toast } from 'react-toastify';
import { GoogleMap, Marker, InfoWindow, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';
import { Container, Spinner, Navbar, Button, Badge } from 'react-bootstrap';
import Sidebar from '../components/Sidebar';
import { FaBars, FaRoute } from 'react-icons/fa';
import { getAuth, signOut } from 'firebase/auth';
import useIdleTimer from '../hooks/useIdleTimer';
import './MapPage.css';

const mapContainerStyle = { width: '100%', height: '100%' };
const center = { lat: 18.4638, lng: -97.3931 };

const MapPage = () => {
    const { currentUser } = useAuth();
    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPedido, setSelectedPedido] = useState(null);
    const [showSidebar, setShowSidebar] = useState(false);
    const [hoveredPedidoId, setHoveredPedidoId] = useState(null);
    const [directions, setDirections] = useState(null);
    const [optimizing, setOptimizing] = useState(false);
    const [routeRequest, setRouteRequest] = useState(null);
    const auth = getAuth();

    const handleIdle = useCallback(() => {
        signOut(auth).then(() => {
            toast.warn("Tu sesión ha expirado por inactividad.");
        });
    }, [auth]);
    useIdleTimer(handleIdle);

    const fetchPedidos = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const token = await currentUser.getIdToken();
            const response = await api.get('/api/pedidos', { headers: { Authorization: `Bearer ${token}` } });
            const pedidosActivos = response.data.filter(p => p.geolocation && p.estado?.toLowerCase() !== 'cancelado' && p.estado?.toLowerCase() !== 'entregado');
            setPedidos(pedidosActivos);
        } catch (error) {
            toast.error("Error al cargar los pedidos para el mapa.");
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchPedidos();
    }, [fetchPedidos]);

    const orderedPedidos = useMemo(() => {
        if (!directions || !routeRequest) return pedidos;
        const waypointOrder = directions.routes[0].waypoint_order;
        const reorderedWaypoints = waypointOrder.map(index => routeRequest.waypoints[index].originalPedido);
        return [routeRequest.origin.originalPedido, ...reorderedWaypoints];
    }, [directions, pedidos, routeRequest]);

    const handleOptimizeRoute = () => {
        if (pedidos.length < 2) {
            return toast.info("Necesitas al menos dos pedidos para optimizar una ruta.");
        }
        setOptimizing(true);
        setDirections(null);
        const request = {
            origin: { location: pedidos[0].geolocation, originalPedido: pedidos[0] },
            destination: { location: pedidos[0].geolocation, originalPedido: pedidos[0] },
            waypoints: pedidos.slice(1).map(p => ({ location: p.geolocation, stopover: true, originalPedido: p })),
            optimizeWaypoints: true,
            travelMode: 'DRIVING'
        };
        setRouteRequest(request);
    };

    const directionsCallback = (response) => {
        if (response !== null) {
            if (response.status === 'OK') {
                setDirections(response);
                toast.success("¡Ruta optimizada!");
            } else {
                toast.error("No se pudo calcular la ruta.");
            }
        }
        setOptimizing(false);
    };

    useEffect(() => {
        if (directions) {
            setOptimizing(false);
        }
    }, [directions]);

    const getBadgeVariant = (estado) => {
        switch (estado?.toLowerCase()) {
            case 'en camino': return 'info';
            default: return 'warning';
        }
    };

    return (
        <div className="map-page-wrapper">
            <Sidebar show={showSidebar} handleClose={() => setShowSidebar(false)} />
            <Navbar className="dashboard-navbar">
                <Container fluid>
                    <Button variant="light" onClick={() => setShowSidebar(true)} className="me-2"><FaBars /></Button>
                    <Navbar.Brand href="#">Mapa de Entregas</Navbar.Brand>
                </Container>
            </Navbar>
            <div className="map-page-container">
                <aside className="map-sidebar">
                    <div className="sidebar-header">
                        <h4>Ruta del Día</h4>
                        <Button variant="primary" className="w-100 mt-2" onClick={handleOptimizeRoute} disabled={optimizing || pedidos.length < 2}>
                            {optimizing ? <Spinner as="span" size="sm" /> : <><FaRoute className="me-2" /> Optimizar Ruta</>}
                        </Button>
                    </div>
                    <div className="pedidos-scroll-list">
                        {loading ? <div className="text-center mt-4"><Spinner /></div> : (
                            orderedPedidos.map((pedido, index) => (
                                <div key={pedido.id} className={`pedido-item-map ${hoveredPedidoId === pedido.id ? 'hovered' : ''}`}
                                    onClick={() => setSelectedPedido(pedido)}
                                    onMouseEnter={() => setHoveredPedidoId(pedido.id)}
                                    onMouseLeave={() => setHoveredPedidoId(null)}>
                                    <div className="route-number">{directions ? `${index + 1}` : '•'}</div>
                                    <div className="route-details">
                                        <div className="d-flex justify-content-between">
                                            <h6>{pedido.cliente}</h6>
                                            <Badge pill bg={getBadgeVariant(pedido.estado)} text="dark">{pedido.estado}</Badge>
                                        </div>
                                        <p className="small text-muted mb-1">{pedido.direccion}</p>
                                        {directions && directions.routes[0].legs[index] && <p className="small route-time">Tiempo estimado: {directions.routes[0].legs[index].duration.text}</p>}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </aside>
                <main className="map-container">
                    <GoogleMap mapContainerStyle={mapContainerStyle} zoom={13} center={center}>
                        {!directions && pedidos.map(pedido => <Marker key={pedido.id} position={pedido.geolocation} onClick={() => setSelectedPedido(pedido)} animation={hoveredPedidoId === pedido.id && window.google ? window.google.maps.Animation.BOUNCE : null} />)}
                        {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true }} />}
                        {selectedPedido && <InfoWindow position={selectedPedido.geolocation} onCloseClick={() => setSelectedPedido(null)}><div><h6 className="fw-bold">{selectedPedido.cliente}</h6><p className="mb-1 small">{selectedPedido.direccion}</p><p className="mb-0 small"><strong>Pedido:</strong> {selectedPedido.numeroDeTanques} x {selectedPedido.tamanoTanque}</p></div></InfoWindow>}
                        {routeRequest && <DirectionsService options={{ origin: routeRequest.origin.location, destination: routeRequest.destination.location, waypoints: routeRequest.waypoints.map(wp => ({ location: wp.location, stopover: wp.stopover })), optimizeWaypoints: true, travelMode: 'DRIVING' }} callback={directionsCallback} onLoad={() => setRouteRequest(null)} />}
                    </GoogleMap>
                </main>
            </div>
        </div>
    );
};

export default MapPage;