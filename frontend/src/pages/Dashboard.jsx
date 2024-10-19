import React, { useState, useEffect } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import axios from 'axios';
import Header from '../components/Header';
import { Box, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, Card, CardContent } from "@mui/material";
import ReactPlayer from 'react-player';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@mui/material';
import { useData } from '../context/DataContext';

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
  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/watch?v=PJxxfilLnGI');
  const [imageUrl, setImageUrl] = useState('src/assets/standby.jpg');
  const [isVideo, setIsVideo] = useState(true);
  const [coordinates, setCoordinates] = useState([0, 0]);
  const [isFetching, setIsFetching] = useState(false);
  const { loadData, loadBatteries } = useData();

  const missionStates = [
    'Preflight', 'Lift-off', 'Air brakes', 'Apogee', 'Drogue', 'Main', 'Land'
  ];

  useEffect(() => {
    const fetchData = async () => {
      if (isFetching) return;
      setIsFetching(true);

      try {
        const response = await axios.get("http://192.168.1.145:3000/api/data");
        const newData = response.data.slice(-30);
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

    fetchData();

    const interval = setInterval(fetchData, 1000);

    return () => clearInterval(interval);
  }, [isFetching]);

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
      <Grid container spacing={2} alignItems="stretch">
        <Grid item xs={7}>
          {isVideo ? (
            <ReactPlayer
              url={videoUrl}
              playing
              controls
              width='100%'
              height='500px'
            />
          ) : (
            <img
              src={imageUrl}
              alt="Live feed"
              width='100%'
              height='500px'
            />
          )}
        </Grid>
        <Grid item xs={2.5}>
          <LineChart
            title='ALT'
            width={360}
            height={480}
            series={[
              { data: data.altitude, label: `Max Altitude: ${getMaxValue(data.altitude)} m`, style: { fontSize: '18px', fontWeight: 'bold' } },
            ]}
            xAxis={[{ scaleType: 'point', data: data.time, axisLabelStyles: { fontSize: 12 } }]}
            yAxis={[{ axisLabelStyles: { fontSize: 12 } }]}
            grid={{ vertical: false, horizontal: true }}
          />
          <Box mt={2}>
            <MapContainer center={coordinates} zoom={22} style={{ height: "300px", width: "100%" }}>
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
        <Grid item xs={2}>
          <Card>
            <CardContent>
              {[
                { label: 'Latitude', value: data.latitude[data.latitude.length - 1] },
                { label: 'Longitude', value: data.longitude[data.longitude.length - 1] },
                { label: 'Velocity (km/h)', value: data.velocity[data.velocity.length - 1] },
                { label: 'Altitude (m)', value: data.altitude[data.altitude.length - 1] },
                { label: 'Temperature (°C)', value: data.temperature[data.temperature.length - 1] },
                { label: 'Pressure', value: data.pressure[data.pressure.length - 1] },
                { label: 'Air brakes angle', value: data.air_brake_angle[data.air_brake_angle.length - 1] },
                { label: 'CONOPS', value: data.mission_state[data.mission_state.length - 1] },
              ].map((item, index) => (
                <Grid container key={index} spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="h5" align="left">
                      {item.label}:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="h4" align="right">
                      {item.value}
                    </Typography>
                  </Grid>
                </Grid>
              ))}
            </CardContent>
          </Card>
          <Box mt={3}>
            <TableContainer component={Paper} style={{ maxHeight: '500px', overflow: 'auto' }}>
              <Table aria-label="mission state table" size="small">
                <TableHead>
                  <TableRow>
                    <TableCell style={{ width: '50%' }}>Phase</TableCell>
                    <TableCell align="right" style={{ width: '50%' }}>State</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {missionStates.map((state, index) => (
                    <TableRow key={state} style={{
                      backgroundColor: data.mission_state[data.mission_state.length - 1] === index ? '#f0f0f0' : 'white'
                    }}>
                      <TableCell component="th" scope="row" style={{ fontSize: '20px', color: '#333', padding: '8px' }}>
                        {state}
                      </TableCell>
                      <TableCell align="right" style={{ fontSize: '20px', color: data.mission_state[data.mission_state.length - 1] === index ? '#ff0000' : '#333', padding: '8px' }}>
                        {data.mission_state[data.mission_state.length - 1] === index ? 'Active' : 'Inactive'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          <Button onClick={() => setIsVideo(!isVideo)} variant="contained" color="primary" style={{ marginTop: '10px', width: '100%' }}>
            {isVideo ? "Mostrar Imagen" : "Mostrar Video"}
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
}
