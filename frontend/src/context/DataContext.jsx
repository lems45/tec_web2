import { createContext, useState, useContext } from "react";
import { getAllDataRequest, getHistory , getAllLogs, getAllXitzin2Data, getAllBatteries} from "../api/data.api";

const DataContext = createContext();

export const useData = () => {
    const context = useContext(DataContext);

    if (!context) {
        throw new Error("useData must be used within a DataContext");
    }
    return context;
}

export const DataProvider = ({ children }) => {
    const [data, setData] = useState([]);
    const [errors, setErrors] = useState({});

    const loadData = async () => {
        const res = await getAllDataRequest();
        setData(res.data);
    }

    const loadBatteries = async () => {
        const res = await getAllBatteries();
    }

    const loadXitzin2Data = async () => {
        const res = await getAllXitzin2Data();
        setData(res.data);
    }

    const loadHistory = async () => {
        const res = await getHistory();
        setData(res.data);
    }

    const loadLogs = async () => {
        const res = await getAllLogs();
        setData(res.data);
    }

    return (
        <DataContext.Provider
            value={{
                data,
                errors,
                loadData,
                loadHistory,
                loadLogs,
                loadXitzin2Data,
                loadBatteries
            }}
        >
            {children}
        </DataContext.Provider>
    )
};