import React from 'react';
import { Offcanvas, Nav } from 'react-bootstrap';
import { FaClipboardList, FaMapMarkedAlt, FaChartBar, FaUserClock } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Sidebar = ({ show, handleClose }) => {
    return (
        <Offcanvas show={show} onHide={handleClose} placement="start">
            <Offcanvas.Header closeButton>
                <Offcanvas.Title className="fw-bold">GasControl Pro</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <Nav className="flex-column">
                    <Nav.Link as={Link} to="/dashboard" className="d-flex align-items-center mb-2 fs-5">
                        <FaClipboardList className="me-3" /> Mis Pedidos
                    </Nav.Link>
                    <Nav.Link as={Link} to="/fiados" className="d-flex align-items-center mb-2 fs-5">
                        <FaUserClock className="me-3" /> Control de Fiados
                    </Nav.Link>
                    <Nav.Link as={Link} to="/map" className="d-flex align-items-center mb-2 fs-5">
                        <FaMapMarkedAlt className="me-3" /> Mapa de Entregas
                    </Nav.Link>
                    <Nav.Link as={Link} to="/reportes" className="d-flex align-items-center fs-5">
                        <FaChartBar className="me-3" /> Reportes
                    </Nav.Link>
                </Nav>
            </Offcanvas.Body>
        </Offcanvas>
    );
};

export default Sidebar;