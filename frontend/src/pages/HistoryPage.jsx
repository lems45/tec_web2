import React, { useEffect } from 'react';
import { Box, Typography, useTheme, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Grid } from "@mui/material";
import { ResponsiveBar } from "@nivo/bar";
import { useData } from '../context/DataContext';
import Header from "../components/Header";

const HistoryPage = () => {
    const theme = useTheme();
    const { data, loadHistory } = useData();
    const colors = theme.palette.mode === 'light' ? ['#7cb305'] : ['#82ca9d']; // Define tus propios colores
    const barChartData = data.map(row => ({ date: row.date, conteo: row.conteo }));

    useEffect(() => {
        loadHistory();
    }, []);

    return (
        <>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Header title="Historial" />
                    <Box m={2} bgcolor="white" borderRadius={8} boxShadow={3}>
                        <Box my={2}>
                            <Typography variant="h5" align="center" color="black">Gráfico de Barras</Typography>
                        </Box>
                        <Box height="75vh" position="relative">
                            <ResponsiveBar
                                data={barChartData}
                                keys={['conteo']}
                                indexBy="date"
                                margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                                padding={0.3}
                                colors={{ scheme: 'nivo' }}
                                borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                                axisBottom={{
                                    tickSize: 5,
                                    tickPadding: 5,
                                    tickRotation: 0,
                                    legend: 'Fecha',
                                    legendPosition: 'middle',
                                    legendOffset: 32,
                                    tickValues: 4,
                                    legendTextColor: '#000',
                                    legendTextOpacity: 1
                                }}
                                axisLeft={{
                                    tickSize: 5,
                                    tickPadding: 5,
                                    tickRotation: 0,
                                    legend: 'Conteo',
                                    legendPosition: 'middle',
                                    legendOffset: -40,
                                    legendTextColor: '#000',
                                    legendTextOpacity: 1
                                }}
                                labelSkipWidth={12}
                                labelSkipHeight={12}
                                labelTextColor="black"
                                animate={true}
                                motionStiffness={90}
                                motionDamping={15}
                                theme={{
                                    tooltip: {
                                        container: {
                                            color: 'white'
                                        }
                                    }
                                }}
                            />
                        </Box>
                    </Box>
                    <Box my={2}>
                        <Typography variant="h4" align="center" color="white">Tabla de Datos</Typography>
                    </Box>
                    <TableContainer style={{ backgroundColor: 'transparent', marginBottom: '20px' }}>
                        <Table style={{ backgroundColor: 'transparent' }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell><Typography variant="h6">Fecha</Typography></TableCell>
                                    <TableCell><Typography variant="h6">Conteo</Typography></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {data.map((row, index) => (
                                    <TableRow key={index}>
                                        <TableCell><Typography variant="subtitle1">{row.date}</Typography></TableCell>
                                        <TableCell><Typography variant="subtitle1">{row.conteo}</Typography></TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            </Grid>
        </>
    );
}

export default HistoryPage;
