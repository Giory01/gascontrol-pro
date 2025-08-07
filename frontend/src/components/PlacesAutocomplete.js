import React, { useRef, useEffect, useState } from 'react';
import { Form, ListGroup } from 'react-bootstrap';

const PlacesAutocomplete = ({ onPlaceSelect }) => {
    const [inputValue, setInputValue] = useState('');
    const [predictions, setPredictions] = useState([]);
    
    const autocompleteService = useRef(null);
    const placesService = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (window.google) {
            autocompleteService.current = new window.google.maps.places.AutocompleteService();
            placesService.current = new window.google.maps.places.PlacesService(document.createElement('div'));
        }
    }, []);

    const handleInputChange = (e) => {
        const value = e.target.value;
        setInputValue(value);
        // Informar al componente padre del cambio manual
        onPlaceSelect({ formatted_address: value, geometry: null }); 

        if (autocompleteService.current && value) {
            autocompleteService.current.getPlacePredictions({ input: value, componentRestrictions: { country: 'mx' } }, (preds) => {
                setPredictions(preds || []);
            });
        } else {
            setPredictions([]);
        }
    };

    const handlePredictionClick = (prediction) => {
        setInputValue(prediction.description);
        setPredictions([]); // Ocultar la lista

        placesService.current.getDetails({ placeId: prediction.place_id, fields: ['formatted_address', 'geometry.location'] }, (placeDetails) => {
            if (placeDetails) {
                // Informar al componente padre de la selección
                onPlaceSelect(placeDetails);
            }
        });
    };

    return (
        <div className="autocomplete-container">
            <Form.Control
                ref={inputRef}
                type="text"
                placeholder="Busca la dirección del cliente..."
                value={inputValue}
                onChange={handleInputChange}
                required
            />
            {predictions.length > 0 && (
                <ListGroup className="autocomplete-dropdown">
                    {predictions.map(prediction => (
                        <ListGroup.Item
                            key={prediction.place_id}
                            action
                            onClick={() => handlePredictionClick(prediction)}
                            className="suggestion-item"
                        >
                            {prediction.description}
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            )}
        </div>
    );
};

export default PlacesAutocomplete;