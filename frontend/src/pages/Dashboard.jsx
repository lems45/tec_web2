import React, { useState, useEffect, useRef } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import axios from 'axios';
import Header from '../components/Header';
import { Box, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Card, CardContent } from "@mui/material";
import ReactPlayer from 'react-player';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@mui/material';
import * as d3 from 'd3';
import { useData } from '../context/DataContext';
import throttle from 'lodash.throttle';
import VideoPlayer from '../pages/VideoPlayer';

export default function SimpleLineChart() {
  const [data, setData] = useState({
    date: [],
    time: [],
    altitude: [],
    temperature: [],
    pressure: [],
    velocity: [],
    latitude: [],
    longitude: [],
    accel_x: [],
    accel_y: [],
    accel_z: [],
    mission_state: [],
    air_brake_angle: []
  });
  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/watch?v=-LKTt2XGn3o');
  const [imageUrl, setImageUrl] = useState('src/assets/standby.jpg');
  const [isVideo, setIsVideo] = useState(true);
  const [coordinates, setCoordinates] = useState([0, 0]);
  const [isFetching, setIsFetching] = useState(false);
  const { loadData, loadBatteries } = useData();

  const missionStates = [
    'Preflight', 'Lift-off', 'Air brakes', 'Apogee', 'Drogue', 'Main', 'Land'
  ];


  // Refs to hold the SVG containers for D3.js
  const altitudeRef = useRef();

  const fetchData = async () => {
    if (isFetching) return;
    setIsFetching(true);

    try {
      const response = await axios.get("http://localhost:3000/api/data");
      const newData = response.data;
      const date = newData.map(dataObj => dataObj.date);
      const time = newData.map(dataObj => dataObj.time);
      const altitude = newData.map(dataObj => dataObj.altitude);
      const temperature = newData.map(dataObj => dataObj.temperature);
      const pressure = newData.map(dataObj => dataObj.pressure);
      const velocity = newData.map(dataObj => dataObj.velocity);
      const latitude = newData.map(dataObj => dataObj.latitude);
      const longitude = newData.map(dataObj => dataObj.longitude);
      const accel_x = newData.map(dataObj => dataObj.accel_x);
      const accel_y = newData.map(dataObj => dataObj.accel_y);
      const accel_z = newData.map(dataObj => dataObj.accel_z);
      const mission_state = newData.map(dataObj => dataObj.mission_state);
      const air_brake_angle = newData.map(dataObj => dataObj.air_brake_angle);

      setData({
        date, time, altitude, temperature, pressure, velocity,
        latitude, longitude, accel_x, accel_y, accel_z, mission_state, air_brake_angle
      });

      setCoordinates([latitude[latitude.length - 1], longitude[longitude.length - 1]]);
    } catch (error) {
      console.error("Error fetching data:", error);
    }

    setIsFetching(false);
  };


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


    // Create or update the line charts with d3.js
    createLineChart(altitudeRef.current, data.time, data.altitude, 'Altitude (m)');
  }, [data]);

  const createLineChart = (container, xData, yData, label) => {
    // Clear previous SVG content
    d3.select(container).selectAll('*').remove();

    const margin = { top: 35, right: 5, bottom: 7, left: 40 };
    const width = 800 - margin.left - margin.right;
    const height = 390 - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear()
      .domain([0, yData.length - 1])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(yData)])
      .range([height, 0]);

    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSize(4));

    svg.append('g')
      .call(d3.axisLeft(y));

    svg.append('path')
      .datum(yData)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
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


  const MapUpdater = ({ coordinates }) => {
    const map = useMap();
    useEffect(() => {
      map.setView(coordinates, map.getZoom());
    }, [coordinates, map]);
    return null;
  };

  const getMaxValue = (array) => {
    return array.length > 0 ? Math.max(...array) : 0;
  };

  return (
    <Box m="0px">
      <Header title="AKBAL-II LIVE VIEW / POTROROCKETS SAFI-UAEMéx" />
      <Grid container spacing={2} style={{ padding: '20px' }}>

        {/* Sección de Video o Imagen */}
        <Grid item xs={6}>
          {isVideo ? (
            <VideoPlayer url={videoUrl} isPlaying={true} />
          ) : (
            <img
              src={imageUrl}
              alt="Live feed"
              width="1280px"
              height="576px"
            />
          )}

        </Grid>

        {/* Gráficas y Mapa */}
        <Grid item xs={6}>
          <Grid container alignItems="center" justifyContent="flex-end" spacing={2}>
            <Grid item xs={4}>
              <Box mt={0} display="flex" justifyContent="flex-end">
                <Grid alignContent={'revert'}>
                  <TableContainer component={Paper} style={{ maxHeight: '355px', overflow: 'auto' }}>
                    <Table aria-label="mission state table" size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell style={{ width: '100%' }}>Fase</TableCell>
                          <TableCell align="right" style={{ width: '100%' }}>Estado</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {missionStates.map((state, index) => (
                          <TableRow
                            key={state}
                            style={{
                              backgroundColor: data.mission_state[data.mission_state.length - 1] === index ? '#f0f0f0' : 'white',
                            }}
                          >
                            <TableCell component="th" scope="row" style={{ fontSize: '20px', color: '#333', padding: '8px' }}>
                              {state}
                            </TableCell>
                            <TableCell
                              align="right"
                              style={{
                                fontSize: '20px',
                                color: data.mission_state[data.mission_state.length - 1] === index ? '#ff0000' : '#333',
                              }}
                            >
                              {data.mission_state[data.mission_state.length - 1] === index ? 'Activo' : 'Inactivo'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Box>
              <Box mt={0} display="flex" justifyContent="flex-end">
                {/* Botón para cambiar entre Video/Imagen */}
                <Button
                  onClick={() => setIsVideo(!isVideo)}
                  variant="contained"
                  color="secondary"
                  style={{ marginTop: '10px', alignContent: 'flex-end', width: '62%', justifyItems: 'flex-end' }}
                >
                  {isVideo ? "Mostrar Imagen" : "Mostrar Video"}
                </Button>
              </Box>
            </Grid>
            {/* Mapa */}
            <Grid item xs={7.5}>
              <Box mt={0} display="flex" justifyContent="flex-end">
                <MapContainer center={coordinates} zoom={22} style={{ height: "400px", width: "100%" }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Marker position={coordinates}>
                    <Popup>
                      Coordenadas actuales: {coordinates[0]}, {coordinates[1]}
                    </Popup>
                  </Marker>
                  <MapUpdater coordinates={coordinates} />
                </MapContainer>
              </Box>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      {/* Gráfica de Altitud */}
      <Box mt={-20} display="flex" justifyContent="center" style={{ width: '100%' }}>
        <Grid container alignItems="center" justifyContent="flex-end" spacing={1}>
          <Grid item xs={5}>
            <Card>
              <CardContent>
                <div
                  ref={altitudeRef}
                  style={{
                    marginRight: '700px', // Align to the right margin
                    marginLeft: 'auto',
                    width: '100%',
                    maxWidth: '1000px', // Controla el ancho máximo de la gráfica
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
      <Box mt={-35} display="flex" justifyContent="center" style={{ width: '100%' }}>
        <Grid container spacing={2} alignItems="center" justifyContent="center">
          <Grid item xs={1.9}>
            <Card>
              <CardContent>
                {[
                  { label: 'Latitude', value: data.latitude[data.latitude.length - 1] },
                  { label: 'Longitude', value: data.longitude[data.longitude.length - 1] },
                  { label: 'Velocity (km/h)', value: data.velocity[data.velocity.length - 1] },
                  { label: 'Altitude (m)', value: data.altitude[data.altitude.length - 1] },
                  { label: 'Temperature(°C)', value: data.temperature[data.temperature.length - 1] },
                  { label: 'Pressure', value: data.pressure[data.pressure.length - 1] },
                  { label: 'Air brakes angle', value: data.air_brake_angle[data.air_brake_angle.length - 1] },
                  { label: 'CONOPS', value: data.mission_state[data.mission_state.length - 1] },
                ].map((item, index) => (
                  <Grid container key={index} spacing={5}>
                    <Grid item xs={6}>
                      <Typography variant="h5" align="left">{item.label}:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="h4" align="right">{item.value}</Typography>
                    </Grid>
                  </Grid>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box >
  );
}
