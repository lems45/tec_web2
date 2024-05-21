import React, { useState, useEffect } from 'react';
import { Box, Typography, useTheme, Button } from "@mui/material";
import { DataGrid } from '@mui/x-data-grid';
import { Link, Navigate } from "react-router-dom";
import { tokens } from "../../theme";
import { useData } from '../context/DataContext';
import Header from "../components/Header";

const DateSelectionPage = () => {
    const theme = useTheme();
    const sum = 0;
    const { data, loadHistory } = useData();
    const colors = tokens(theme.palette.mode);
    const [selectedRows, setSelectedRows] = React.useState([]);
    const [totalCount, setTotalCount] = useState(0); // Estado para almacenar la suma de conteos

    useEffect(() => {
        loadHistory();
    }, [selectedRows, data]);

    // Definir función para obtener el identificador único de cada fila
    const getRowId = (row) => {
        return row.date; // Utiliza la propiedad 'date' de cada fila como identificador único
    };

    const columns = [
        { field: "date", headerName: "Fecha" },
        { field: "conteo", headerName: "Conteo", flex: 1 },
    ];

    const handleRowSelectionChange = (selectionModel) => {
        const selectedIds = new Set(selectionModel);
        let sum = 0;
        for (const id of selectedIds) {
            const row = data.find((row) => getRowId(row) === id);
            if (row) {
                sum += row.conteo;
            }
        }
        setTotalCount(sum);
    }

    return (
        <Box m="20px">
            <Box m="10px">
            <Typography variant="h6" sx={{ m: 2, fontSize: '1.5rem' }}>
  Total de Conteo Seleccionado: {totalCount}
</Typography>
            </Box>
            <Box
                m="30px 0 0 0"
                height="75vh"
                sx={{
                    "& .MuiDataGrid-root": { border: "none" },
                    "& .MuiDataGrid-cell": { borderBottom: "none" },
                    "& .name-column--cell": { color: colors.greenAccent[300] },
                    "& .MuiDataGrid-columnHeaders": { backgroundColor: colors.blueAccent[700], borderBottom: "none" },
                    "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
                    "& .MuiDataGrid-footerContainer": { borderTop: "none", backgroundColor: colors.blueAccent[700] },
                    "& .MuiCheckbox-root": { color: `${colors.greenAccent[200]} !important` },
                }}
            >
                <DataGrid
                    checkboxSelection
                    rows={data}
                    columns={columns}
                    getRowId={getRowId} // Utiliza la función getRowId para obtener identificadores únicos de las filas
                    onRowSelectionModelChange={handleRowSelectionChange} // Manejar cambios en las filas seleccionadas
                />
            </Box>
        </Box>
    );
}

export default DateSelectionPage;
