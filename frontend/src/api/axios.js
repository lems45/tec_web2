import axios from "axios";

const baseURL = import.meta.env.VITE_BACKEND || "http://192.168.1.145:3000/api";

const client = axios.create({
  baseURL,
  withCredentials: true,
});

export default client;
