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

  const RocketModel = () => {
    const mountRef = useRef(null);
    const modelRef = useRef();
    const timeRef = useRef(0);
    const isMountedRef = useRef(true);

    useEffect(() => {
      // Configuración inicial
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({ alpha: true });

      renderer.setSize(400, 400);
      if (mountRef.current) {
        mountRef.current.appendChild(renderer.domElement);
      }

      // Configurar el DRACOLoader
      const dracoLoader = new DRACOLoader();
      dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');

      // Crear un GLTFLoader y asignar el DRACOLoader
      const loader = new GLTFLoader();
      loader.setDRACOLoader(dracoLoader);

      loader.load(
        'src/assets/ensamblaje1/ensamblaje1.gltf', // Ruta al modelo GLTF
        (gltf) => {
          if (!isMountedRef.current) return; // Evitar cambios si el componente ya se desmontó
            if (node.isMesh && node.material) {
                if (Array.isArray(node.material)) {
                    node.material.forEach(material => {
                        material.color = new THREE.Color(0x808080); // Color gris
                        material.map = null; // Elimina la textura
                    });
                } else {
                    node.material.color = new THREE.Color(0x808080); // Color gris
                    node.material.map = null; // Elimina la textura
                }
            }

          modelRef.current = gltf.scene; 
          scene.add(modelRef.current);
          modelRef.current.scale.set(0.2, 0.2, 0.2);
          modelRef.current.position.set(-0.5, 0, 0);
          modelRef.current.rotation.set(0, 0, Math.PI);
      
          // Reemplazar las texturas por un material básico sin texturas
          modelRef.current.traverse((child) => {
            if (child.isMesh) {
              if (child.material.map) {
                // Reemplazar cualquier mapa de textura con un color uniforme
                child.material.map = null;
              }
              child.material = new THREE.MeshBasicMaterial({ color: 0x808080 }); // Color gris sin textura
            }
          });
        },
        undefined,
        (error) => console.error('Error loading 3D model:', error)
      );
          

      // luces y cámara
      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(5, 5, 5);
      scene.add(light);
      scene.add(new THREE.AmbientLight(0x404040));

      camera.position.set(2, 9, 3);
      camera.lookAt(0, 0, 0);

      const animate = () => {
        if (!isMountedRef.current) return; // Detener la animación si el componente se desmonta
        requestAnimationFrame(animate);
        if (modelRef.current) {
          timeRef.current += 0.05;
          const pitchAmplitude = 0.5;
          const rollAmplitude = 0.5;
          const speed = 0.02;
          modelRef.current.rotation.x = Math.sin(timeRef.current * speed) * pitchAmplitude;
          modelRef.current.rotation.z = Math.cos(timeRef.current * speed) * rollAmplitude;
        }
        renderer.render(scene, camera);
      };
      animate();

      // Limpieza al desmontar
      return () => {
        isMountedRef.current = false; // Marcar el componente como desmontado
        if (mountRef.current && renderer.domElement) {
          mountRef.current.removeChild(renderer.domElement); // Verificar que mountRef.current no sea null
        }
        renderer.dispose();
        scene.clear();
      };
    }, []);

    return <div ref={mountRef} />;
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
        createLineChart(altitudeRef.current, data.time, data.altitude, 'Altitude (m)');
      }
    }, [data]);

    const createLineChart = (container, xData, yData, label) => {
      d3.select(container).selectAll('*').remove();

      const margin = { top: 35, right: 5, bottom: 18, left: 40 };
      const width = 800 - margin.left - margin.right;
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
          {/* Columna Izquierda */}
          <Grid item xs={12} md={3}>
            <SpaceXCard style={{ marginTop: '0px' }}>
              <SpaceXTitle variant="h6">Flight Phases</SpaceXTitle>
              <TableContainer component={Paper} style={{ maxHeight: '355px', overflow: 'auto' }}>
                <Table aria-label="mission state table" size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontSize: '14px' }}>Phase</TableCell>
                      <TableCell align="right" sx={{ fontSize: '14px' }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {missionStates.map((state, index) => (
                      <TableRow key={state} style={{ backgroundColor: data.mission_state[data.mission_state.length - 1] === index ? '#1E3A8A' : '#112240' }}>
                        <TableCell sx={{ fontSize: '14px', color: '#61DAFB', padding: '8px' }}>{state}</TableCell>
                        <TableCell align="right" sx={{ fontSize: '14px', color: data.mission_state[data.mission_state.length - 1] === index ? '#61DAFB' : '#CBD6E3' }}>
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
                        <Typography variant="h6" sx={{ fontSize: '14px' }}>{label}:</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="h5" sx={{ fontSize: '16px' }} align="right">{data[keyMap[label]][data[keyMap[label]].length - 1] || 'N/A'}</Typography>
                      </Grid>
                    </Grid>
                  );
                })}
              </CardContent>
            </SpaceXCard>
          </Grid>

          {/* Columna Central */}
          <Grid item xs={12} md={6}>
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
            <SpaceXCard style={{ marginTop: '20px' }}>
              <SpaceXTitle variant="h6">Altitude Chart</SpaceXTitle>
              <CardContent>
                <div ref={altitudeRef} style={{ width: '100%', height: '310px' }} />
              </CardContent>
            </SpaceXCard>
          </Grid>

          {/* Columna Derecha */}
          <Grid item xs={12} md={3}>
            <SpaceXCard>
              <SpaceXTitle variant="h6">Current Location</SpaceXTitle>
              <Box style={{ height: "300px", width: "100%" }}>
                <MapContainer center={coordinates} zoom={22} style={{ height: "100%", width: "100%" }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='© <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
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
            <SpaceXCard style={{ marginTop: '20px' }}>
              <SpaceXTitle variant="h6">Rocket Orientation</SpaceXTitle>
              <CardContent>
                <RocketModel />
              </CardContent>
            </SpaceXCard>
          </Grid>
        </Grid>
      </SpaceXContainer>
    );
  }
