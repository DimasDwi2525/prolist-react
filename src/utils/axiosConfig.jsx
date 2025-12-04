// src/utils/axiosConfig.js
import axios from "axios";

const instance = axios.create({
  baseURL: `${window.location.protocol}//${window.location.hostname}:8000`,
  withCredentials: true, // Ini yang penting!
});
export default instance;
