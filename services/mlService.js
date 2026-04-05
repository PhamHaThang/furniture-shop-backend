const axios = require("axios");

const ML_SERVICE_URL =
    process.env.PYTHON_ML_SERVICE_URL || "http://127.0.0.1:8001";

const mlApi = axios.create({
    baseURL: ML_SERVICE_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    },
});

const callMLService = async (endpoint, request, params = {}) => {
    try {
        const response = await mlApi.post(endpoint, request, { params });
        return response.data;
    } catch (error) {
        const message =
            error.response?.data?.detail ||
            error.response?.data?.message ||
            error.message ||
            "ML service unavailable";
        const statusCode = error.response?.status || 503;
        const serviceError = new Error(message);
        serviceError.statusCode = statusCode;
        throw serviceError;
    }
};
const checkMLServiceHealth = async () => {
    try {
        const response = await mlApi.get("/health");
        return response.data;
    } catch (error) {
        return {
            status: "down",
            message: error.message || "ML service unavailable",
        };
    }
};

module.exports = {
    callMLService,
    checkMLServiceHealth,
};
