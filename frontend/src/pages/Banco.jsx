import React, { useState, useEffect, useRef } from 'react';
import { baseURL } from '../api/axios';
import { useData } from '../context/DataContext';
import axios from 'axios';
import { Box, Grid, Typography, Card, CardContent, Button, useMediaQuery } from '@mui/material';
import * as d3 from 'd3';
import Header from '../components/Header';
import throttle from 'lodash.throttle';

export default function Dashboard() {
  const [data, setData] = useState({
    date: [],
    time: [],
    fuerza: [],
    temperatura: [],
    presion: [],
  });

  const metricolors = {
    fuerza: 'steelblue',
    temperatura: 'green',
    presion: 'orange',
  };

  const [isFetching, setIsFetching] = useState(false);

  const pressureRef = useRef();
  const temperatureRef = useRef();
  const forceRef = useRef();

  const isMobile = useMediaQuery('(max-width:600px)');

  // Función que realiza la solicitud
  const fetchData = async () => {
    if (isFetching) return; // Evita hacer solicitudes mientras se está haciendo una
    setIsFetching(true);

    try {
      const response = await axios.get(`${baseURL}/bancodepruebas`);
      const newData = response.data;
      const date = newData.map(dataObj => dataObj.date);
      const time = newData.map(dataObj => dataObj.time);
      const fuerza = newData.map(dataObj => dataObj.fuerza);
      const temperatura = newData.map(dataObj => dataObj.temperatura);
      const presion = newData.map(dataObj => dataObj.presion);

      setData({
        date, time, fuerza, temperatura, presion
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }

    setIsFetching(false);
  };

  // Usar throttle para limitar las solicitudes a cada 5 segundos
  const throttledFetchData = throttle(fetchData, 100);

  useEffect(() => {
    // Llamada inicial
    throttledFetchData();

    // Elimina el uso de setInterval, solo llamamos throttledFetchData
    // en un intervalo controlado por throttle cada 5 segundos

    const interval = setInterval(() => {
      throttledFetchData();
    }, 100);

    // Limpia el intervalo cuando el componente se desmonta
    return () => {
      clearInterval(interval); // Elimina el intervalo al desmontar el componente
    };
  }, []);

  useEffect(() => {
    // Limitar los datos a los últimos 100 valores antes de graficarlos
    const limitData = (dataArray) => dataArray.slice(-100);

    const animate = () => {
      createLineChart(forceRef.current, data.fuerza, limitData(data.fuerza), 'Fuerza (Ns)', 'steelblue');
      createLineChart(pressureRef.current, data.time, limitData(data.presion), 'Presión (Psi)', 'orange');
      createLineChart(temperatureRef.current, data.time, limitData(data.temperatura), 'Temperatura (°C)', 'green');
    };

    animate();
  }, [data]);

  const createLineChart = (container, xData, yData, label, color) => {
    // Clear previous SVG content
    d3.select(container).selectAll('svg').remove();

    const margin = { top: 40, right: 10, bottom: 15, left: 40 };
    const width = isMobile ? 300 : 670 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
      .domain([yData.length - 1, 0])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([d3.max(yData), 0])
      .range([0, height]);

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSize(3));

    svg.append('g')
      .call(d3.axisLeft(y));

    svg.append('path')
      .datum(yData)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 3)
      .attr('d', d3.line()
        .x((d, i) => x(i))
        .y(d => y(d))
      );

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 0 - margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '26px')
      .style('font-weight', 'bold')
      .style('fill', 'white')
      .text(label);
  };

  const handleIgnition = async () => {
    try {
      // Send the "IGNICIÓN" command to the server
      await axios.post(`${baseURL}/ignicion`, { command: "IGNICION" });
      console.log("Ignition command sent");
    } catch (error) {
      console.error("Error sending ignition command:", error);
    }
  };

  return (
    <Box m="0px">
      <Header title="BANCO DE PRUEBAS / POTROROCKETS SAFI-UAEMéx" />
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4.5}>
              <Card>
                <CardContent>
                  <div ref={forceRef}></div>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4.5}>
              <Card>
                <CardContent>
                  <div ref={temperatureRef}></div>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={10} sm={2}>
              <Card>
                <CardContent>
                  {[
                    { label: 'Fuerza', value: data.fuerza[data.fuerza.length - 99], color: metricolors.fuerza },
                    { label: 'Presion', value: data.presion[data.presion.length - 99], color: metricolors.presion },
                    { label: 'Temperatura(°C)', value: data.temperatura[data.temperatura.length - 99], color: metricolors.temperatura },
                  ].map((item, index) => (
                    <Grid container key={index} spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="h5" align="left" style={{ color: item.color }}>{item.label}:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="h4" align="right">{item.value}</Typography>
                      </Grid>
                    </Grid>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  {[
                    { label: 'Máx Fuerza', value: Math.max(...data.fuerza), color: metricolors.fuerza },
                    { label: 'Máx Presión', value: Math.max(...data.presion), color: metricolors.presion },
                    { label: 'Máx Temperatura', value: Math.max(...data.temperatura), color: metricolors.temperatura },
                  ].map((item, index) => (
                    <Grid container key={index} spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="h5" align="left" style={{ color: item.color }}>
                          {item.label}:
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="h4" align="right" style={{ color: item.color }}>
                          {item.value}
                        </Typography>
                      </Grid>
                    </Grid>
                  ))}
                </CardContent>
              </Card>
                <Box mt={2} display="flex" justifyContent="center">
                  <Button variant="contained" color="secondary" onClick={handleIgnition}>
                    Ignición
                  </Button>
                </Box>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4.5}>
              <Card>
                <CardContent>
                  <div ref={pressureRef}></div>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
