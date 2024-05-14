import axios from "./axios";

export const getAllDataRequest = () => axios.get("/data");

export const postData = (data) => axios.post('/data', data);