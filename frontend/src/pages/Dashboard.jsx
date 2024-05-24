import React, { useState, useEffect } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import axios from 'axios';
import { Box, Typography, useTheme, Button, CardContent, Card, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Grid, colors } from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import { Link, Navigate } from "react-router-dom";
import { tokens } from "../../theme";
import { ResponsiveBar } from "@nivo/bar";
import { useData } from '../context/DataContext';
import Header from "../components/Header";

export default function CombinedComponent() {
  // Code for SimpleLineChart component
  const theme = useTheme();
  const [data, setData] = useState({ pc: [], avg: [], labels: [], conteo: [] });
  const colores = tokens(theme.palette.mode);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/data");
        const newData = response.data.slice(-30); // Obtener los últimos 30 datos
        const pc = newData.map(dataObj => dataObj.pc);
        const avg = newData.map(dataObj => dataObj.avg);
        const labels = newData.map(dataObj => dataObj.time);
        const conteo = newData.map(dataObj => dataObj.conteo);
        setData({ pc, avg, labels, conteo });
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();

    // Establecer intervalo para refrescar los datos cada cierto tiempo
    const interval = setInterval(fetchData, 6000); // Refrescar 

    return () => clearInterval(interval); // Limpiar el intervalo al desmontar el componente
  }, []); // La dependencia vacía asegura que useEffect solo se ejecute al montar el componente

  // Code for DateSelectionPage component
  const { data: gridData, loadLogs } = useData();
  const [selectedRows, setSelectedRows] = React.useState([]);

  useEffect(() => {
    loadLogs();
  }, []);

  const getRowId = (row) => {
    return row.date; // Utiliza la propiedad 'date' de cada fila como identificador único
  };

  const columns = [
    { field: "log_id", headerName: "ID" },
    { field: "user_id", headerName: "ID Usuario" },
    { field: "username", headerName: "Usuario" },
    { field: "fecha", headerName: "Time" },
  ];

  // Code for HistoryPage component
  const { data: historyData, loadHistory } = useData();
  const historyColors = useTheme().palette.mode === 'light' ? ['#7cb305'] : ['#82ca9d'];
  const barChartData = historyData.map(row => ({ date: row.date, conteo: row.conteo }));

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <>
      <Box m="10px">
        {/* SimpleLineChart */}
        <Header title="Información en tiempo real" />
        <Box display="flex" justifyContent="space-between">
          <Box flex="1">
            <LineChart
              title='Datos en tiempo real: '
              width={1100}
              height={300}
              series={[
                { data: data.pc, label: `pc: ${data.pc[data.pc.length - 1]}` },
                { data: data.avg, label: `avg: ${data.avg[data.avg.length - 1]}` },
              ]}
              xAxis={[{ scaleType: 'point', data: data.labels }]}
              grid={{ vertical: true, horizontal: true }}
            />
          </Box>
          <Box flex="0 0 200px">
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontSize="20px">
                  Conteo:
                </Typography>
                <Typography variant="h4" component="div" fontSize="20px">
                  {data.conteo[data.conteo.length - 1]}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>

      {/* DateSelectionPage */}
      <Box m="20px">
        <Header title="Logs de usuarios" />
        <Box m="10px">
        </Box>
        <Box
          m="30px 0 0 0"
          height="75vh"
          sx={{
            "& .MuiDataGrid-root": { border: "none" },
            "& .MuiDataGrid-cell": { borderBottom: "none" },
            "& .name-column--cell": { color: colores.greenAccent[300] },
            "& .MuiDataGrid-columnHeaders": { backgroundColor: colores.blueAccent[700], borderBottom: "none" },
            "& .MuiDataGrid-virtualScroller": { backgroundColor: colores.primary[400] },
            "& .MuiDataGrid-footerContainer": { borderTop: "none", backgroundColor: colores.blueAccent[700] },
            "& .MuiCheckbox-root": { color: `${colores.greenAccent[200]} !important` },
          }}
        >
          <DataGrid
            id="grid-two"
            rows={gridData}
            columns={columns}
            getRowId={(row) => row.log_id}
          />
        </Box>
      </Box>

      {/* HistoryPage */}
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
        </Grid>
      </Grid>
    </>
  );
}
