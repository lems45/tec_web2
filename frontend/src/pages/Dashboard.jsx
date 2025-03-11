import React, { useState, useEffect, useRef } from 'react';
import { baseURL } from '../api/axios';
import axios from 'axios';
import Header from '../components/Header';
import { Box, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Card, CardContent, Button } from '@mui/material';
import ReactPlayer from 'react-player';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as d3 from 'd3';
import { useData } from '../context/DataContext';
import throttle from 'lodash.throttle';
import VideoPlayer from '../pages/VideoPlayer';
import { styled } from '@mui/system';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

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
  borderBottom: '2px solid #61DAFB',
});

const SpaceXButton = styled(Button)({
  background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
  boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
  color: 'white',
  padding: '10px 20px',
  width: '100%',
  '&:hover': {
    background: 'linear-gradient(45deg, #d84315 30%, #e65100 90%)',
  },
});

const RocketModel = () => {
  const mountRef = useRef(null);
  const modelRef = useRef();
  const timeRef = useRef(0);

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000); // FOV ajustado a 60
    const renderer = new THREE.WebGLRenderer({ alpha: true });

    renderer.setSize(300, 455); // Tamaño del canvas
    mountRef.current.appendChild(renderer.domElement);

    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://unpkg.com/three@0.174.0/examples/jsm/libs/draco/'); // Ajustado a v174
    loader.setDRACOLoader(dracoLoader);

    loader.load(
      'src/assets/akbal/modeloansys.gltf', // Ruta del modelo
      (gltf) => {
        modelRef.current = gltf.scene;
        scene.add(modelRef.current);

        // Ajustar escala para que encaje en el canvas (altura ~0.314 m)
        modelRef.current.scale.set(7, 7, 7); // Escala original

        // Centrar el modelo basado en las coordenadas mínimas y máximas
        const centerY = (-2.54034 + 0.6) / 2; // Centro aproximado en Y
        modelRef.current.position.set(-4, -centerY * 8, -6); // Ajustar posición en Y según escala

        console.log('Modelo cargado:', gltf);
      },
      undefined,
      (error) => console.error('Error loading 3D model:', error)
    );

    // Configurar iluminación
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 10, 10); // Luz desde un ángulo más alto y distante
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    // Posicionar la cámara para una vista frontal-elevada
    camera.position.set(0, 0, 15); // Distancia de 15 unidades para capturar la altura
    camera.lookAt(0, 0, 0); // Mirar al centro

    const animate = () => {
      requestAnimationFrame(animate);
      if (modelRef.current) {
        timeRef.current += 0.05;
        const pitchAmplitude = 0.2; // Reducir amplitud para movimiento suave
        const rollAmplitude = 0.2;
        const speed = 0.06; // Reducir velocidad para animación más lenta
        modelRef.current.rotation.x = Math.sin(timeRef.current * speed) * pitchAmplitude;
        modelRef.current.rotation.z = Math.cos(timeRef.current * speed) * rollAmplitude;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (mountRef.current && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '455px'}} />;
};

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
    air_brake_angle: [],
  });
  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/watch?v=-LKTt2XGn3o');
  const [newVideoUrl] = useState('https://www.youtube.com/watch?v=-LKTt2XGn3o'); // Temporal, reemplaza con ID real
  const [isVideo, setIsVideo] = useState(true);
  const [currentFeedIndex, setCurrentFeedIndex] = useState(0);
  const [coordinates, setCoordinates] = useState([0, 0]);
  const [isFetching, setIsFetching] = useState(false);
  const [simulatedAltitude, setSimulatedAltitude] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const { loadData, loadBatteries } = useData();

  const missionStates = ['Preflight', 'Lift-off', 'Air brakes', 'Apogee', 'Drogue', 'Main', 'Land'];

  const altitudeRef = useRef();

  const feedOptions = [
    { url: 'https://www.youtube.com/watch?v=-LKTt2XGn3o', type: 'video' },
    { url: 'https://www.youtube.com/watch?v=-LKTt2XGn3o', type: 'video' }, // Reemplaza con ID real
    { url: 'src/assets/standby.jpg', type: 'image' }, // Cambia a ruta relativa a public
  ];

  const fetchData = async () => {
    if (isFetching) return;
    setIsFetching(true);

    try {
      const response = await axios.get(`${baseURL}/data`);
      const newData = response.data;
      const date = newData.map((dataObj) => dataObj.date);
      const time = newData.map((dataObj) => dataObj.time);
      const altitude = newData.map((dataObj) => parseFloat(dataObj.altitude) || 0);
      const temperature = newData.map((dataObj) => parseFloat(dataObj.temperature) || 0);
      const pressure = newData.map((dataObj) => parseFloat(dataObj.pressure) || 0);
      const velocity = newData.map((dataObj) => parseFloat(dataObj.velocity) || 0);
      const latitude = newData.map((dataObj) => parseFloat(dataObj.latitude) || 0);
      const longitude = newData.map((dataObj) => parseFloat(dataObj.longitude) || 0);
      const accel_x = newData.map((dataObj) => parseFloat(dataObj.accel_x) || 0);
      const accel_y = newData.map((dataObj) => parseFloat(dataObj.accel_y) || 0);
      const accel_z = newData.map((dataObj) => parseFloat(dataObj.accel_z) || 0);
      const mission_state = newData.map((dataObj) => parseInt(dataObj.mission_state) || 0);
      const air_brake_angle = newData.map((dataObj) => parseFloat(dataObj.air_brake_angle) || 0);

      setData({
        date,
        time,
        altitude,
        temperature,
        pressure,
        velocity,
        latitude,
        longitude,
        accel_x,
        accel_y,
        accel_z,
        mission_state,
        air_brake_angle,
      });

      setCoordinates([latitude[latitude.length - 1], longitude[longitude.length - 1]]);
    } catch (error) {
      console.error('Error fetching data:', error);
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
    let animationInterval;
    if (isAnimating) {
      let time = 0;
      const durationAscent = 20000;
      const durationPause = 2000;
      const durationDescent = 20000;
      const totalDuration = durationAscent + durationPause + durationDescent;
      const startTime = Date.now();

      animationInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        if (elapsed < durationAscent) {
          const progress = elapsed / durationAscent;
          const altitude = Math.floor(progress * 3000);
          setSimulatedAltitude(altitude);
        } else if (elapsed < durationAscent + durationPause) {
          setSimulatedAltitude(3000);
        } else if (elapsed < totalDuration) {
          const progress = (elapsed - durationAscent - durationPause) / durationDescent;
          const altitude = Math.floor(3000 - (progress * 3000));
          setSimulatedAltitude(altitude);
        } else {
          setSimulatedAltitude(0);
          setIsAnimating(false);
          clearInterval(animationInterval);
        }
      }, 100);
    }

    return () => clearInterval(animationInterval);
  }, [isAnimating]);

  useEffect(() => {
    if (altitudeRef.current) {
      setData((prevData) => ({
        ...prevData,
        altitude: Array(10).fill(simulatedAltitude),
      }));
      createBarometricAltitudeChart(altitudeRef.current, [simulatedAltitude]);
    }
  }, [simulatedAltitude]);

  const createBarometricAltitudeChart = (container, altitudeData) => {
    d3.select(container).selectAll('*').remove();

    const margin = { top: 35, right: 60, bottom: 18, left: 10 };
    const width = 200 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const currentAltitude = altitudeData.length > 0 ? altitudeData[altitudeData.length - 1] : 0;
    const range = 100;
    const minAltitude = Math.max(0, currentAltitude - range);
    const maxAltitude = currentAltitude + range;

    const y = d3.scaleLinear()
      .domain([minAltitude, maxAltitude])
      .range([height, 0]);

    svg.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', height)
      .attr('fill', '#1D2D4A');

    const majorTicks = d3.range(Math.floor(minAltitude / 10) * 10, maxAltitude + 10, 10);
    svg.selectAll('.major-tick')
      .data(majorTicks)
      .enter()
      .append('line')
      .attr('x1', width - 20)
      .attr('x2', width)
      .attr('y1', d => y(d))
      .attr('y2', d => y(d))
      .attr('stroke', 'white')
      .attr('stroke-width', 2);

    svg.selectAll('.major-tick-label')
      .data(majorTicks)
      .enter()
      .append('text')
      .attr('x', width + 10)
      .attr('y', d => y(d) + 5)
      .text(d => d)
      .attr('fill', 'white')
      .attr('font-size', '14px')
      .attr('text-anchor', 'start');

    const minorTicks = d3.range(Math.ceil(minAltitude / 2) * 2, maxAltitude + 2, 2);
    svg.selectAll('.minor-tick')
      .data(minorTicks.filter(d => !majorTicks.includes(d)))
      .enter()
      .append('line')
      .attr('x1', width - 10)
      .attr('x2', width)
      .attr('y1', d => y(d))
      .attr('y2', d => y(d))
      .attr('stroke', 'white')
      .attr('stroke-width', 1);

    const pointerY = y(currentAltitude);
    svg.append('polygon')
      .attr('points', `${width - 30},${pointerY - 10} ${width},${pointerY} ${width - 30},${pointerY + 10}`)
      .attr('fill', '#61DAFB');

    svg.append('rect')
      .attr('x', 0)
      .attr('y', pointerY - 15)
      .attr('width', 60)
      .attr('height', 30)
      .attr('fill', '#112240')
      .attr('stroke', '#61DAFB')
      .attr('stroke-width', 1);

    svg.append('text')
      .attr('x', 30)
      .attr('y', pointerY + 5)
      .text(Math.round(currentAltitude))
      .attr('fill', 'white')
      .attr('font-size', '16px')
      .attr('text-anchor', 'middle');

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 0 - margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '26px')
      .style('font-weight', 'bold')
      .style('fill', 'white')
      .text('Altitude (m)');
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

  const handleFeedChange = () => {
    setCurrentFeedIndex((prevIndex) => (prevIndex + 1) % feedOptions.length);
    const selectedFeed = feedOptions[currentFeedIndex % feedOptions.length];
    setVideoUrl(selectedFeed.url);
    setIsVideo(selectedFeed.type === 'video');
  };

  const toggleAnimation = () => {
    setIsAnimating((prev) => !prev);
    if (!isAnimating) {
      setSimulatedAltitude(0);
    }
  };

  useEffect(() => {
    const selectedFeed = feedOptions[currentFeedIndex];
    setVideoUrl(selectedFeed.url);
    setIsVideo(selectedFeed.type === 'video');
  }, [currentFeedIndex]);

  return (
    <SpaceXContainer>
      <Header
        title="AKBAL-II LIVE VIEW / POTROROCKETS SAFI-UAEMéx"
        style={{ backgroundColor: '#0A192F', color: '#61DAFB', padding: '15px', textAlign: 'center', fontSize: '24px', fontWeight: 'bold' }}
      />
      <Grid container spacing={2}>
        {/* Columna Izquierda: Datos y Fases */}
        <Grid item xs={12} md={2.2}>
          <SpaceXCard>
            <SpaceXTitle variant="h6">Flight Phases</SpaceXTitle>
            <TableContainer component={Paper} style={{ maxHeight: '555px', overflow: 'auto' }}>
              <Table aria-label="mission state table" size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontSize: '14px' }}>Phase</TableCell>
                    <TableCell align="right" sx={{ fontSize: '14px' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {missionStates.map((state, index) => (
                    <TableRow
                      key={state}
                      style={{
                        backgroundColor: data.mission_state[data.mission_state.length - 1] === index ? '#1E3A8A' : '#112240',
                      }}
                    >
                      <TableCell sx={{ fontSize: '20px', color: '#61DAFB', padding: '8px' }}>{state}</TableCell>
                      <TableCell
                        align="right"
                        sx={{
                          fontSize: '20px',
                          color: data.mission_state[data.mission_state.length - 1] === index ? '#61DAFB' : '#CBD6E3',
                        }}
                      >
                        {data.mission_state[data.mission_state.length - 1] === index ? 'Active' : 'Inactive'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </SpaceXCard>
          <SpaceXCard style={{ marginTop: '20px' }}>
            <SpaceXTitle variant="h6">Real-Time Data</SpaceXTitle>
            <CardContent>
              {['Latitude', 'Longitude', 'Velocity (km/h)', 'Altitude (m)', 'Temperature(°C)', 'Pressure', 'Air brakes angle', 'CONOPS'].map(
                (label, index) => {
                  const keyMap = {
                    'Latitude': 'latitude',
                    'Longitude': 'longitude',
                    'Velocity (km/h)': 'velocity',
                    'Altitude (m)': 'altitude',
                    'Temperature(°C)': 'temperature',
                    'Pressure': 'pressure',
                    'Air brakes angle': 'air_brake_angle',
                    'CONOPS': 'mission_state',
                  };
                  return (
                    <Grid container key={index} spacing={1}>
                      <Grid item xs={6}>
                        <Typography variant="h6" sx={{ fontSize: '22px' }}>
                          {label}:
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="h5" sx={{ fontSize: '22px' }} align="right">
                          {data[keyMap[label]][data[keyMap[label]].length - 1] || 'N/A'}
                        </Typography>
                      </Grid>
                    </Grid>
                  );
                }
              )}
            </CardContent>
          </SpaceXCard>
        </Grid>

        {/* Columna Central: Feed en Vivo y Gráfica */}
        <Grid item xs={12} md={6.8}>
          <SpaceXCard>
            <SpaceXTitle variant="h6">Live Feed</SpaceXTitle>
            {isVideo ? (
              <VideoPlayer url={videoUrl} isPlaying={true} />
            ) : (
              <img src={videoUrl} alt="Standby Image" style={{ width: '100%', height: 'auto' }} />
            )}
            <Box mt={2}>
              <SpaceXButton onClick={handleFeedChange}>
                {currentFeedIndex === 0 && 'Switch to Sri Lanka 4K'}
                {currentFeedIndex === 1 && 'Switch to Standby Image'}
                {currentFeedIndex === 2 && 'Switch to Current Feed'}
              </SpaceXButton>
            </Box>
          </SpaceXCard>
        </Grid>

        {/* Columna Derecha: Reorganizada */}
        <Grid item xs={12} md={3}>
          <Grid container spacing={2}>
            {/* Fila con Altitude Chart and Rocket Orientation */}
            <Grid item xs={12} md={6}>
              <SpaceXCard>
                <SpaceXTitle variant="h6">Altitude Chart</SpaceXTitle>
                <CardContent>
                  <div ref={altitudeRef} style={{ width: '100%', height: '400px', display: 'flex', justifyContent: 'center' }} />
                  <Box mt={2}>
                    <SpaceXButton onClick={toggleAnimation}>
                      {isAnimating ? 'Stop Simulation' : 'Start Simulation'}
                    </SpaceXButton>
                  </Box>
                </CardContent>
              </SpaceXCard>
            </Grid>
            <Grid item xs={12} md={6}>
              <SpaceXCard>
                <SpaceXTitle variant="h6">Rocket Orientation</SpaceXTitle>
                <CardContent>
                  <RocketModel />
                </CardContent>
              </SpaceXCard>
            </Grid>
            {/* Fila con Current Location */}
            <Grid item xs={12} md={12}>
              <SpaceXCard style={{ marginTop: '10px' }}>
                <SpaceXTitle variant="h6">Current Location</SpaceXTitle>
                <Box style={{ height: '300px', width: '100%' }}>
                  <MapContainer center={coordinates} zoom={22} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                    />
                    <Marker position={coordinates}>
                      <Popup>Current Coordinates: {coordinates[0]}, {coordinates[1]}</Popup>
                    </Marker>
                    <MapUpdater coordinates={coordinates} />
                  </MapContainer>
                </Box>
              </SpaceXCard>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </SpaceXContainer>
  );
}