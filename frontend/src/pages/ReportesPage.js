import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { toast } from 'react-toastify';
import { Navbar, Container, Button, Spinner, Row, Col, Card } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaBars } from 'react-icons/fa';
import Sidebar from '../components/Sidebar';
import useIdleTimer from '../hooks/useIdleTimer';
import './ReportesPage.css';

const ReportesPage = () => {
    const { currentUser } = useAuth();
    const [showSidebar, setShowSidebar] = useState(false);
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState('week');
    const auth = getAuth();

    const handleIdle = useCallback(() => {
        signOut(auth).then(() => {
            toast.warn("Tu sesión ha expirado por inactividad.");
        });
    }, [auth]);
    useIdleTimer(handleIdle);

    const getDateRange = (period) => {
        const end = new Date();
        const start = new Date();
        if (period === 'week') {
            start.setDate(end.getDate() - 7);
        } else if (period === 'month') {
            start.setMonth(start.getMonth() - 1);
        } else {
            start.setHours(0, 0, 0, 0);
        }
        return { start: start.toISOString(), end: end.toISOString() };
    };
    
    const [dateRange, setDateRange] = useState(getDateRange('week'));

    const handleFilterChange = (period) => {
        setActiveFilter(period);
        setDateRange(getDateRange(period));
    };

    const fetchReportes = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const token = await currentUser.getIdToken();
            const response = await api.get('/api/reportes', {
                headers: { Authorization: `Bearer ${token}` },
                params: { startDate: dateRange.start, endDate: dateRange.end }
            });
            setReportData(response.data);
        } catch (error) {
            toast.error("Error al cargar los datos del reporte.");
        } finally {
            setLoading(false);
        }
    }, [currentUser, dateRange]);

    useEffect(() => {
        fetchReportes();
    }, [fetchReportes]);

    const processedData = useMemo(() => {
        const entregados = reportData.filter(p => p.estado === 'Entregado');
        const fiados = reportData.filter(p => p.tipoPago === 'Fiado');
        const ingresosTotales = entregados.reduce((sum, p) => sum + (p.precioTotal || 0), 0);
        const cilindrosVendidos = entregados.reduce((sum, p) => sum + (p.numeroDeTanques || 0), 0);
        const nuevosFiados = fiados.reduce((sum, p) => sum + (p.precioTotal || 0), 0);
        const ventasPorTamano = entregados.reduce((acc, p) => {
            acc[p.tamanoTanque] = (acc[p.tamanoTanque] || 0) + (p.numeroDeTanques || 0);
            return acc;
        }, {});
        const chartDataTamano = Object.keys(ventasPorTamano).map(key => ({ name: key, cilindros: ventasPorTamano[key] }));

        return { ingresosTotales, pedidosCompletados: entregados.length, cilindrosVendidos, nuevosFiados, chartDataTamano };
    }, [reportData]);

    return (
        <>
            <Sidebar show={showSidebar} handleClose={() => setShowSidebar(false)} />
            <Navbar className="dashboard-navbar mb-4">
                 <Container fluid>
                    <Button variant="light" onClick={() => setShowSidebar(true)} className="me-2"><FaBars /></Button>
                    <Navbar.Brand href="#">Reportes</Navbar.Brand>
                 </Container>
            </Navbar>
            <Container>
                <div className="reportes-header">
                    <h4 className="mb-3">Reporte de Rendimiento</h4>
                    <div>
                        <Button variant={activeFilter === 'today' ? 'primary' : 'outline-primary'} className="date-filter-btn" onClick={() => handleFilterChange('today')}>Hoy</Button>
                        <Button variant={activeFilter === 'week' ? 'primary' : 'outline-primary'} className="date-filter-btn" onClick={() => handleFilterChange('week')}>Últimos 7 Días</Button>
                        <Button variant={activeFilter === 'month' ? 'primary' : 'outline-primary'} className="date-filter-btn" onClick={() => handleFilterChange('month')}>Último Mes</Button>
                    </div>
                </div>
                {loading ? <div className="text-center py-5"><Spinner /></div> : (
                    <>
                        <Row>
                            <Col md={3} className="mb-3"><Card className="kpi-card"><div className="kpi-label">Ingresos Totales</div><div className="kpi-value">${processedData.ingresosTotales.toFixed(2)}</div></Card></Col>
                            <Col md={3} className="mb-3"><Card className="kpi-card"><div className="kpi-label">Pedidos Completados</div><div className="kpi-value">{processedData.pedidosCompletados}</div></Card></Col>
                            <Col md={3} className="mb-3"><Card className="kpi-card"><div className="kpi-label">Cilindros Vendidos</div><div className="kpi-value">{processedData.cilindrosVendidos}</div></Card></Col>
                            <Col md={3} className="mb-3"><Card className="kpi-card"><div className="kpi-label">Nuevos Fiados</div><div className="kpi-value">${processedData.nuevosFiados.toFixed(2)}</div></Card></Col>
                        </Row>
                        <div className="chart-container">
                            <h5 className="ms-4 mb-3">Ventas por Tamaño de Cilindro</h5>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={processedData.chartDataTamano} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip formatter={(value) => `${value} vendidos`} /><Legend /><Bar dataKey="cilindros" fill="#0d47a1" name="Cilindros Vendidos" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                )}
            </Container>
        </>
    );
};

export default ReportesPage;