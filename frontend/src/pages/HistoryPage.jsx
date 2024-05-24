import React, { useState, useEffect } from 'react';
import { Box, Typography, useTheme } from "@mui/material";
import { ResponsiveBar } from "@nivo/bar";
import { Link, Navigate } from "react-router-dom";
import { tokens } from "../../theme";
import { useData } from '../context/DataContext';
import Header from "../components/Header";

const HistoryPage = () => {
    const theme = useTheme();
    const { data, loadHistory } = useData();
    const colors = tokens(theme.palette.mode);
    const [selectedRows, setSelectedRows] = React.useState([]);
    const [totalCount, setTotalCount] = useState(0); // Estado para almacenar la suma de conteos

    useEffect(() => {
        loadHistory();
    }, []);

    // Obtener los datos necesarios para el gráfico de barras
    const barChartData = data.map(row => ({
        date: row.date,
        conteo: row.conteo
    }));

    const handleRowSelectionChange = (selectionModel) => {
        const selectedIds = new Set(selectionModel);
        let sum = 0;
        for (const id of selectedIds) {
            const row = data.find((row) => row.hs_id === id);
            if (row) {
                sum += row.conteo;
            }
        }
        setTotalCount(sum);
    }

    return (
        <Box m="20px">
            <Box m="10px">
                <Typography variant="h6" sx={{ m: 2, fontSize: '1.5rem' }}>
                    Total de Conteo Seleccionado: {totalCount}
                </Typography>
            </Box>
            <Box
                m="30px 0 0 0"
                height="75vh"
            >
                <ResponsiveBar
                    data={barChartData}
                    keys={['conteo']}
                    indexBy="date"
                    margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                    padding={0.3}
                    colors={{ scheme: 'nivo' }}
                    borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                    axisTop={null}
                    axisRight={null}
                    axisBottom={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: 'Fecha',
                        legendPosition: 'middle',
                        legendOffset: 32
                    }}
                    axisLeft={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: 'Conteo',
                        legendPosition: 'middle',
                        legendOffset: -40
                    }}
                    labelSkipWidth={12}
                    labelSkipHeight={12}
                    labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                    animate={true}
                    motionStiffness={90}
                    motionDamping={15}
                />
            </Box>
        </Box>
    );
}

export default HistoryPage;
