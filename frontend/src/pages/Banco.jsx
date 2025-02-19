import React, { useState, useEffect, useCallback, useRef } from 'react';
import { baseURL } from '../api/axios';
import axios from 'axios';
import { Box, Grid, Typography, Paper, Button, useMediaQuery } from '@mui/material';
import { styled } from '@mui/system';
import * as d3 from 'd3';
import Header from '../components/Header';
import throttle from 'lodash.throttle';

// Custom hook for data fetching
const useFetchData = (endpoint) => {
  const [data, setData] = useState({
    date: [],
    time: [],
    fuerza: [],
    temperatura: [],
    presion: [],
  });
  const [isFetching, setIsFetching] = useState(false);

  const fetchData = useCallback(async () => {
    if (isFetching) return;
    setIsFetching(true);

    try {
      const response = await axios.get(`${baseURL}/bancodepruebas`);
      const newData = response.data;
      setData({
        date: newData.map(dataObj => dataObj.date),
        time: newData.map(dataObj => dataObj.time),
        fuerza: newData.map(dataObj => parseFloat(dataObj.fuerza) || 0),
        temperatura: newData.map(dataObj => parseFloat(dataObj.temperatura) || 0),
        presion: newData.map(dataObj => parseFloat(dataObj.presion) || 0)
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    }

    setIsFetching(false);
  }, [isFetching]);

  useEffect(() => {
    const throttledFetchData = throttle(fetchData, 100);
    
    throttledFetchData();
    
    const interval = setInterval(() => {
      throttledFetchData();
    }, 100);

    return () => clearInterval(interval);
  }, [fetchData]);

  return { data, isFetching };
};

// Custom component for charts (using forwardRef to properly pass refs)
const ChartComponent = React.forwardRef(({ data, label, color, createLineChart }, ref) => {
  useEffect(() => {
    if (ref.current && data.values && data.values.length > 0) {
      createLineChart(ref.current, data.time, data.values, label, color);
    }
  }, [data, label, color, ref, createLineChart]);

  return <div ref={ref}></div>;
});

// Styled components for a control panel theme
const ControlPanel = styled(Paper)(({ theme }) => ({
  backgroundColor: '#0A192F',
  color: '#CBD6E3',
  padding: theme.spacing(2),
  borderRadius: 0,
  border: '1px solid #61DAFB',
  boxShadow: '0 0 20px rgba(97, 218, 251, 0.2)',
}));

const ControlTitle = styled(Typography)({
  color: '#61DAFB',
  textTransform: 'uppercase',
  fontWeight: 'bold',
  textAlign: 'center',
  marginBottom: '1rem',
  paddingBottom: '0.5rem',
  borderBottom: '2px solid #61DAFB'
});

const DataDisplay = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  padding: theme.spacing(1),
  marginBottom: theme.spacing(1),
  borderBottom: '1px solid rgba(97, 218, 251, 0.5)',
  '&:last-child': {
    borderBottom: 'none',
  },
}));

// Dashboard component
export default function Dashboard() {
  const { data, isFetching } = useFetchData('bancodepruebas');
  const isMobile = useMediaQuery('(max-width:600px)');

  const forceRef = useRef();
  const temperatureRef = useRef();
  const pressureRef = useRef();

  const metricolors = {
    fuerza: '#61DAFB',
    temperatura: '#50C878',
    presion: '#FFB74D',
  };

  const handleIgnition = async () => {
    try {
      await axios.post(`${baseURL}/ignicion`, { command: "IGNICION" });
      console.log("Ignition command sent");
    } catch (error) {
      console.error("Error sending ignition command:", error);
    }
  };

  const createLineChart = useCallback((container, xData, yData, label, color) => {
    d3.select(container).selectAll('svg').remove();

    if (yData.length === 0) {
      console.warn('No data for chart:', label);
      return;
    }

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
      .transition()
      .duration(500)
      .attrTween('d', function() {
        const line = d3.line()
          .x((d, i) => x(i))
          .y(d => y(d));
        const prev = d3.select(this).attr('d') || '';
        return function(t) {
          const interpolate = d3.interpolateString(prev, line(yData));
          return interpolate(t);
        };
      });

    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 0 - margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '24px')
      .style('font-weight', 'bold')
      .style('fill', 'white')
      .text(label);
  }, [isMobile]);

  return (
    <Box sx={{ backgroundColor: '#0A192F', color: '#CBD6E3', minHeight: '100vh', p: 2 }}>
      <Header 
        title="BANCO DE PRUEBAS / POTROROCKETS SAFI-UAEMéx" 
        style={{ backgroundColor: '#0A192F', color: '#61DAFB', padding: '15px', textAlign: 'center', fontSize: '24px', fontWeight: 'bold' }}
      />
      <Grid container spacing={2}>
        <Grid item xs={12} md={9}>
          <ControlPanel>
            <ControlTitle variant="h3">Monitor de Parámetros</ControlTitle>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <ControlPanel>
                  <ChartComponent 
                    data={{ time: data.time, values: data.fuerza }} 
                    label="Fuerza (Ns)" 
                    color={metricolors.fuerza} 
                    createLineChart={createLineChart} 
                    ref={forceRef} 
                  />
                </ControlPanel>
              </Grid>
              <Grid item xs={12} sm={6}>
                <ControlPanel>
                  <ChartComponent 
                    data={{ time: data.time, values: data.temperatura }} 
                    label="Temperatura (°C)" 
                    color={metricolors.temperatura} 
                    createLineChart={createLineChart} 
                    ref={temperatureRef} 
                  />
                </ControlPanel>
              </Grid>
              <Grid item xs={12}>
                <ControlPanel>
                  <ChartComponent 
                    data={{ time: data.time, values: data.presion }} 
                    label="Presión (Psi)" 
                    color={metricolors.presion} 
                    createLineChart={createLineChart} 
                    ref={pressureRef} 
                  />
                </ControlPanel>
              </Grid>
            </Grid>
          </ControlPanel>
        </Grid>
        <Grid item xs={12} md={2}>
          <Grid container direction="column" spacing={2}>
            <Grid item>
              <ControlPanel>
                <ControlTitle variant="h4">Datos en Tiempo Real</ControlTitle>
                {['fuerza', 'presion', 'temperatura'].map((metric, index) => (
                  <DataDisplay key={index}>
                    <Typography variant ="h3" sx={{ color: metricolors[metric] }}>
                      {metric.charAt(0).toUpperCase() + metric.slice(1)}:
                    </Typography>
                    <Typography variant="h3">
                      {data[metric][data[metric].length - 1] || 'N/A'}
                    </Typography>
                  </DataDisplay>
                ))}
              </ControlPanel>
            </Grid>
            <Grid item>
              <ControlPanel>
                <ControlTitle variant="h4">Máximos Registrados</ControlTitle>
                {['fuerza', 'presion', 'temperatura'].map((metric, index) => (
                  <DataDisplay key={index}>
                    <Typography variant="h3" sx={{ color: metricolors[metric] }}>
                      Máx {metric.charAt(0).toUpperCase() + metric.slice(1)}:
                    </Typography>
                    <Typography variant="h3" sx={{ color: metricolors[metric] }}>
                      {Math.max(...data[metric]) || 'N/A'}
                    </Typography>
                  </DataDisplay>
                ))}
              </ControlPanel>
            </Grid>
            <Grid item>
              <Button 
                variant="contained" 
                color="secondary"
                onClick={handleIgnition}
                sx={{
                  width: '100%',
                  background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                  boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
                  color: 'white',
                  padding: '10px 20px',
                }}
              >
                Ignición
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
}
