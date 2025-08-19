import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Container, Card, Button, ListGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import './ProfilePage.css'; // Importamos los nuevos estilos

const ProfilePage = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    return (
        <Container>
            <Card className="profile-card">
                <div className="profile-header">
                    <img
                        src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${currentUser.displayName || 'G'}&background=ffffff&color=0d47a1&size=128`}
                        alt="Foto de perfil"
                        className="profile-avatar"
                    />
                    <h4>{currentUser.displayName}</h4>
                </div>
                <ListGroup variant="flush" className="profile-details">
                    <ListGroup.Item>
                        <strong>Correo Electrónico:</strong> {currentUser.email}
                    </ListGroup.Item>
                    <ListGroup.Item>
                        <strong>Miembro desde:</strong> {new Date(currentUser.metadata.creationTime).toLocaleDateString()}
                    </ListGroup.Item>
                </ListGroup>
                <Card.Body className="text-center">
                    <Button variant="secondary" onClick={() => navigate(-1)}>
                        Regresar
                    </Button>
                </Card.Body>
            </Card>
        </Container>
    );
};

export default ProfilePage;