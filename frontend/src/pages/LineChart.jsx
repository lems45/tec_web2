import * as React from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import axios from 'axios';
import Header from "../components/Header";
import { Box, Typography, useTheme, Button } from "@mui/material";

let pc = [];
let avg = [];
let labels = [];

axios.get("http://localhost:3000/api/data").then(res => {
  console.log("res: ", res)
  for (const dataObj of res.data) {
    pc.push(dataObj.pc);
    avg.push(dataObj.avg);
    labels.push(dataObj.time);
  }
});
// console.log("uData: ", uData)
// console.log("pc: ", pc)
// console.log("avg", avg)
// console.log("time: ", labels)


export default function SimpleLineChart() {
  return (
    <Box m="20px">
      <Header title="Información en tiempo real" />
      <LineChart
        title='Datos en tiempo real: '
        width={1300}
        height={600}
        series={[
          { data: pc, label: 'pc' },
          { data: avg, label: 'avg' },
        ]}
        xAxis={[{ scaleType: 'point', data: labels }]}
      />
    </Box>
  );
}
