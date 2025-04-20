import axios from "axios";
import { getRefreshedToken, isAccessTokenExpired, setAuthUser } from "./auth";
import { API_BASE_URL } from "./constants";
import Cookies from "js-cookie";

const useAxios = () => {
  const accessToken = Cookies.get("access_token");
  const refreshToken = Cookies.get("refresh_token");

  const axiosInstance = axios.create({
    // Set the base URL for all requests
    baseURL: API_BASE_URL,
    // Set the authorization header with the access token
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  // Add an interceptor to check if the access token is expired
  // before sending a request
  axiosInstance.interceptors.request.use(async (req) => {
    // If the access token is not expired, return the request
    if (!isAccessTokenExpired(accessToken)) {
      return req;
    }

    // If the access token is expired, get a new access token
    // and refresh token from the server
    const response = await getRefreshedToken(refreshToken);

    // Set the new access token and refresh token in the cookie
    setAuthUser(response.data?.access, response.data?.refresh);

    // Update the authorization header with the new access token
    req.headers.Authorization = `Bearer ${response.data?.access}`;

    // Return the updated request
    return req;
  });

  // Return the axios instance with the interceptor
  return axiosInstance;
};

export default useAxios;
