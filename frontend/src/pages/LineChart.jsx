import React, { useState, useEffect } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import axios from 'axios';
import Header from "../components/Header";
import { Box, Typography, useTheme, Button, CardContent, Card } from "@mui/material";

export default function SimpleLineChart() {
  const [data, setData] = useState({ pc: [], avg: [], labels: [], conteo: [] });

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
    const interval = setInterval(fetchData, 3000); // Refrescar 

    return () => clearInterval(interval); // Limpiar el intervalo al desmontar el componente
  }, []); // La dependencia vacía asegura que useEffect solo se ejecute al montar el componente

  return (
    <Box m="10px">
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
  );
}
