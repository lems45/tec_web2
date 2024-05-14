import React, { useState } from 'react';
import { Grid, Typography, Box, TextField, Button } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import axios from 'axios';

function DateSelectionPage() {
    const [selectedDate, setSelectedDate] = useState(null);
    const [conteoData, setConteoData] = useState([]);

    // Función para manejar el cambio en la fecha seleccionada
    const handleDateChange = (date) => {
        setSelectedDate(date);
    };

    // Función para obtener el desglose de "conteo" para la fecha seleccionada
    const getConteoData = async () => {
        try {
            if (!selectedDate) {
                console.log('Por favor, seleccione una fecha.');
                return;
            }

            // Realizar una solicitud al servidor para obtener el desglose de "conteo"
            const response = await axios.get('http://localhost:3000/api/history', { date: selectedDate });
            // Actualizar el estado con los datos de "conteo"
            setConteoData(response.data);
        } catch (error) {
            console.error('Error al obtener el desglose de "conteo":', error);
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Typography variant="h4" gutterBottom>
                        Seleccionar una fecha:
                    </Typography>
                    <Box display="flex" alignItems="center">
                        <DatePicker
                            value={selectedDate}
                            onChange={handleDateChange}
                            renderInput={(params) => <TextField {...params} variant="outlined" />}
                        />
                        <Button variant="contained" onClick={getConteoData}>
                            Obtener desglose de conteo
                        </Button>
                    </Box>
                </Grid>
                {conteoData.length > 0 && (
                    <Grid item xs={12}>
                        <Typography variant="h4" gutterBottom>
                            Desglose de conteo:
                        </Typography>
                        <ul>
                            {conteoData.map((data, index) => (
                                <li key={index}>
                                    <Typography>
                                        Fecha: {data.date}, Conteo: {data.conteo}
                                    </Typography>
                                </li>
                            ))}
                        </ul>
                    </Grid>
                )}
            </Grid>
        </LocalizationProvider>
    );
}

export default DateSelectionPage;
