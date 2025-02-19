import React, { useState, useEffect, useRef } from 'react';
import { baseURL } from '../api/axios';
import axios from 'axios';
import Header from '../components/Header';
import { Box, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Card, CardContent, Button } from "@mui/material";
import ReactPlayer from 'react-player';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as d3 from 'd3';
import { useData } from '../context/DataContext';
import throttle from 'lodash.throttle';
import VideoPlayer from '../pages/VideoPlayer';
import { styled } from '@mui/system';

// Styled components for SpaceX theme
const SpaceXContainer = styled(Box)({
  backgroundColor: '#0A192F',
  color: '#CBD6E3',
  minHeight: '100vh',
  padding: '20px',
});

const SpaceXCard = styled(Card)({
  backgroundColor: '#112240',
  color: '#CBD6E3',
  borderRadius: '8px',
  border: '1px solid #61DAFB',
  boxShadow: '0 4px 8px rgba(97, 218, 251, 0.1)',
});

const SpaceXTitle = styled(Typography)({
  color: '#61DAFB',
  textTransform: 'uppercase',
  fontWeight: 'bold',
  textAlign: 'center',
  marginBottom: '1rem',
  paddingBottom: '0.5rem',
  borderBottom: '2px solid #61DAFB'
});

const SpaceXButton = styled(Button)({
  background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
  boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
  color: 'white',
  padding: '10px 20px',
  width: '100%',
  '&:hover': {
    background: 'linear-gradient(45deg, #d84315 30%, #e65100 90%)',
  }
});

export default function LaunchDashboard() {
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
      const response = await axios.get(`${baseURL}/data`);
      const newData = response.data;
      const date = newData.map(dataObj => dataObj.date);
      const time = newData.map(dataObj => dataObj.time);
      const altitude = newData.map(dataObj => parseFloat(dataObj.altitude) || 0);
      const temperature = newData.map(dataObj => parseFloat(dataObj.temperature) || 0);
      const pressure = newData.map(dataObj => parseFloat(dataObj.pressure) || 0);
      const velocity = newData.map(dataObj => parseFloat(dataObj.velocity) || 0);
      const latitude = newData.map(dataObj => parseFloat(dataObj.latitude) || 0);
      const longitude = newData.map(dataObj => parseFloat(dataObj.longitude) || 0);
      const accel_x = newData.map(dataObj => parseFloat(dataObj.accel_x) || 0);
      const accel_y = newData.map(dataObj => parseFloat(dataObj.accel_y) || 0);
      const accel_z = newData.map(dataObj => parseFloat(dataObj.accel_z) || 0);
      const mission_state = newData.map(dataObj => parseInt(dataObj.mission_state) || 0);
      const air_brake_angle = newData.map(dataObj => parseFloat(dataObj.air_brake_angle) || 0);

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
    throttledFetchData();
    const interval = setInterval(() => {
      throttledFetchData();
    }, 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (altitudeRef.current) {
      createLineChart(altitudeRef.current, data.time, data.altitude);
    }
  }, [data]);

  const createLineChart = (container, xData, yData, label) => {
    d3.select(container).selectAll('*').remove();

    const margin = { top: 5, right: 5, bottom: 15, left: 40 };
    const width = 450 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

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
      .attr('stroke', '#61DAFB')
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
    <SpaceXContainer>
      <Header title="AKBAL-II LIVE VIEW / POTROROCKETS SAFI-UAEMéx" style={{ backgroundColor: '#0A192F', color: '#61DAFB', padding: '15px', textAlign: 'center', fontSize: '24px', fontWeight: 'bold' }} />
      <Grid container spacing={2}>
        {/* Columna Izquierda (2 partes) */}
        <Grid item xs={12} md={1.6}>
          <SpaceXCard>
            <SpaceXTitle variant="h6">Real-Time Data</SpaceXTitle>
            <CardContent>
              {['Latitude', 'Longitude', 'Velocity (km/h)', 'Altitude (m)', 'Temperature(°C)', 'Pressure', 'Air brakes angle', 'CONOPS'].map((label, index) => {
                const keyMap = {
                  'Latitude': 'latitude',
                  'Longitude': 'longitude',
                  'Velocity (km/h)': 'velocity',
                  'Altitude (m)': 'altitude',
                  'Temperature(°C)': 'temperature',
                  'Pressure': 'pressure',
                  'Air brakes angle': 'air_brake_angle',
                  'CONOPS': 'mission_state'
                };
                return (
                  <Grid container key={index} spacing={1}>
                    <Grid item xs={6}>
                      <Typography variant="h6">{label}:</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="h5" align="right">{data[keyMap[label]][data[keyMap[label]].length - 1] || 'N/A'}</Typography>
                    </Grid>
                  </Grid>
                );
              })}
            </CardContent>
          </SpaceXCard>
          <SpaceXCard style={{ marginTop: '20px' }}>
            <SpaceXTitle variant="h6">Flight Phases</SpaceXTitle>
            <TableContainer component={Paper} style={{ maxHeight: '355px', overflow: 'auto' }}>
              <Table aria-label="mission state table" size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Phase</TableCell>
                    <TableCell align="right">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {missionStates.map((state, index) => (
                    <TableRow key={state} style={{ backgroundColor: data.mission_state[data.mission_state.length - 1] === index ? '#1E3A8A' : '#112240' }}>
                      <TableCell style={{ color: '#61DAFB', padding: '8px' }}>{state}</TableCell>
                      <TableCell align="right" style={{ color: data.mission_state[data.mission_state.length - 1] === index ? '#61DAFB' : '#CBD6E3' }}>
                        {data.mission_state[data.mission_state.length - 1] === index ? 'Active' : 'Inactive'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </SpaceXCard>
        </Grid>

        {/* Columna Central (1 parte) */}
        <Grid item xs={12} md={7}>
          <SpaceXCard>
            <SpaceXTitle variant="h6">Live Feed</SpaceXTitle>
            {isVideo ? (
              <VideoPlayer url={videoUrl} isPlaying={true} />
            ) : (
              <img src='src/assets/standby.jpg' alt="Standby Image" style={{ width: '100%', height: 'auto' }} />
            )}
            <Box mt={2}>
              <SpaceXButton onClick={() => setIsVideo(!isVideo)}>
                {isVideo ? "Show Image" : "Show Video"}
              </SpaceXButton>
            </Box>
          </SpaceXCard>
        </Grid>

        {/* Columna Derecha (2 partes) */}
        <Grid item xs={12} md={3.4}>
          <SpaceXCard>
            <SpaceXTitle variant="h6">Altitude Chart</SpaceXTitle>
            <CardContent>
              <div ref={altitudeRef} style={{ width: '100%', height: '300px' }} />
            </CardContent>
          </SpaceXCard>
          <SpaceXCard style={{ marginTop: '20px' }}>
            <SpaceXTitle variant="h6">Current Location</SpaceXTitle>
            <Box style={{ height: "300px", width: "100%" }}>
              <MapContainer center={coordinates} zoom={22} style={{ height: "100%", width: "50%" }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                />
                <Marker position={coordinates}>
                  <Popup>
                    Current Coordinates: {coordinates[0]}, {coordinates[1]}
                  </Popup>
                </Marker>
                <MapUpdater coordinates={coordinates} />
              </MapContainer>
            </Box>
          </SpaceXCard>
        </Grid>
      </Grid>
    </SpaceXContainer>
  );
}
