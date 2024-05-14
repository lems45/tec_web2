import React, { useState, useEffect } from 'react';
import { Grid, Card, Box, CardContent } from '@mui/material';
import SimpleLineChart from "./LineChart";
import Header from "../components/Header";
import { useTheme } from '@emotion/react';
import { tokens } from '../../theme';

function Dashboard() {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);

    // Estado para almacenar la fecha y hora actual
    const [currentDateTime, setCurrentDateTime] = useState(new Date());

    // Función para actualizar la fecha y hora cada segundo
    useEffect(() => {
        const intervalId = setInterval(() => {
            setCurrentDateTime(new Date());
        }, 1000);

        // Limpieza del intervalo cuando el componente se desmonta o se actualiza
        return () => clearInterval(intervalId);
    }, []); // Este efecto solo se ejecutará una vez al montar el componente, gracias al arreglo de dependencias vacío

    return (
        <Grid container spacing={2}>
            <Grid item xs={12}>
                <Card sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Header title="Dashboard" sx={{ textAlign: 'center', flex: '1' }} />
                    <Box sx={{ paddingRight: '16px' }}>
                        <CardContent>
                            <div style={{ fontSize: '20px' }}>{currentDateTime.toLocaleString()}</div>
                        </CardContent>
                    </Box>
                </Card>
            </Grid>
            <Grid item xs={12}>
                <Card sx={{ display: 'flex' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                        <CardContent sx={{ flex: '1 0 auto' }}>
                            <SimpleLineChart />
                        </CardContent>
                    </Box>
                </Card>
            </Grid>
        </Grid>
    );
}

export default Dashboard;
