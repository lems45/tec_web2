import axios from "./axios";

export const getAllDataRequest = () => axios.get("/data");

export const getAllLogs = () => axios.get("/userslog");

export const postData = (data) => axios.post('/data', data);

export const getHistory = () => axios.get("/history");