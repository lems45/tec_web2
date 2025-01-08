import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Box, Grid, Typography, Card, CardContent, LinearProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as d3 from 'd3';
import Header from '../components/Header';
import throttle from 'lodash.throttle';
import { baseURL } from '../api/axios';

export default function Dashboard() {
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

  const [coordinates, setCoordinates] = useState([0, 0]);
  const [batteryData, setBatteryData] = useState([]);
  const [isFetching, setIsFetching] = useState(false);

  const missionStates = ['Preflight', 'Lift-off', 'Air brakes', 'Apogee', 'Drogue', 'Main', 'Land'];

  // Refs to hold the SVG containers for D3.js
  const altitudeRef = useRef();
  const velocityRef = useRef();
  const pressureRef = useRef();
  const temperatureRef = useRef();


    const fetchData = async () => {
      if (isFetching) return;
      setIsFetching(true);

      try {
        const response = await axios.get(`${baseURL}/data`);
        const batteryResponse = await axios.get(`${baseURL}/batteries`);

        const newData = response.data.slice(-40);
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
        setBatteryData(prevBatteryData => {
          const updatedBatteryData = [...prevBatteryData];

          batteryResponse.data.forEach(newBattery => {
            const existingBatteryIndex = updatedBatteryData.findIndex(battery => battery.battery_id === newBattery.battery_id);
            if (existingBatteryIndex !== -1) {
              updatedBatteryData[existingBatteryIndex] = newBattery;
            } else {
              updatedBatteryData.push(newBattery);
            }
          });

          return updatedBatteryData;
        });

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
    createLineChart(velocityRef.current, data.time, data.velocity, 'Velocity (km/h)');
    createLineChart(pressureRef.current, data.time, data.pressure, 'Pressure (Pa)');
    createLineChart(temperatureRef.current, data.time, data.temperature, 'Temperature (°C)');
  }, [data]);

  const createLineChart = (container, xData, yData, label) => {
    // Clear previous SVG content
    d3.select(container).selectAll('*').remove();

    const margin = { top: 40, right: 25, bottom: 0, left: 30 };
    const width = 550 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

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
      .call(d3.axisBottom(x).tickSize(5));

    svg.append('g')
      .call(d3.axisLeft(y));

    svg.append('path')
      .datum(yData)
      .attr('fill', 'none')
      .attr('stroke', 'steelblue')
      .attr('stroke-width', 4)
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

  return (
    <Box m="0px">
      <Header title="AKBAL-II LIVE TELEMETRY / POTROROCKETS SAFI-UAEMéx" />
      <Grid container spacing={2} alignItems="stretch">
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
                <Grid container key={index} spacing={1}>
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
          <Box mt={3}>
            <Card>
              <CardContent>
                <Grid item xs={12}>
                  {batteryData.slice(0, 5).map((battery) => (
                    <Card key={battery.battery_id} style={{ marginBottom: '10px' }}>
                      <CardContent>
                        <Typography variant="h4">Battery ID: {battery.battery_id}</Typography>
                        <Typography variant="h4">Battery Level:</Typography>
                        <LinearProgress
                          variant="determinate"
                          value={battery.battery_level}
                          sx={{ height: 30 }}
                          color={battery.battery_level < 50 ? 'error' : 'success'}
                        />
                        <Typography variant="h5">Voltage: {battery.voltage} V</Typography>
                        <Typography variant="h5">Temperature: {battery.temperature} °C</Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Box>
        </Grid>
        <Grid item xs={10.1}>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <Card>
                <CardContent>
                  <Grid item xs={1}>
                    <div ref={altitudeRef}></div>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card>
                <CardContent>
                  <div ref={velocityRef}></div>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card>
                <CardContent>
                  <div ref={pressureRef}></div>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Card>
                <CardContent>
                  <div ref={temperatureRef}></div>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={4}>
              <Box mt={2}>
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
            <Grid item xs={3}>
              <Card>
                <TableContainer component={Paper} style={{ maxHeight: '500px', overflow: 'auto' }}>
                  <Table aria-label="mission state table" size="medium">
                    <TableHead>
                      <TableRow>
                        <TableCell style={{ width: '70%', fontSize: '30px' }}>Phase</TableCell>
                        <TableCell align="right" style={{ width: '70%', fontSize: '30px' }}>State</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {missionStates.map((state, index) => (
                        <TableRow key={state} style={{
                          backgroundColor: data.mission_state[data.mission_state.length - 1] === index ? '#f0f0f0' : 'white'
                        }}>
                          <TableCell component="th" scope="row" style={{ fontSize: '30px', color: '#333', padding: '8px' }}>
                            {state}
                          </TableCell>
                          <TableCell align="right" style={{ fontSize: '30px', color: data.mission_state[data.mission_state.length - 1] === index ? '#ff0000' : '#333', padding: '8px' }}>
                            {data.mission_state[data.mission_state.length - 1] === index ? 'Active' : 'Inactive'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
