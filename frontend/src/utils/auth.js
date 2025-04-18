import { useAuthStore } from "../store/auth";
import axios from "./axios";
import jwt_decode from "jwt-decode";
import Cookie from "js-cookie";
import Swal from "sweetalert2";

export const login = async (email, password) => {
  try {
    const { data, status } = await axios.post(`user/token/`, {
      email,
      password,
    });

    // If the request is successful, set the access and refresh tokens in the cookie
    if (status === 200) {
      setAuthUser(data.access, data.refresh);
    }

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error.response.data?.detail || "Something went wrong",
    };
  }
};

export const register = async (full_name, email, password, password2) => {
  try {
    const { data } = await axios.post(`user/register/`, {
      full_name,
      email,
      password,
      password2,
    });

    await login(email, password);
    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error.response.data &&
        error.response.data.full_name &&
        error.response.data.email
          ? `${error.response.data.full_name} - ${error.response.data.email}`
          : "Something went wrong",
    };
  }
};

export const logout = () => {
  Cookie.remove("access_token");
  Cookie.remove("refresh_token");
  useAuthStore.getState().setUser(null);
};

export const setUser = async () => {
  /**
   * This function checks if the access token and refresh token are present
   * in the cookie. If they are not present, it does not do anything.
   *
   * If the access token is expired, it calls the `getRefreshedToken` function
   * to get a new access token and refresh token. It then calls the `setAuthUser`
   * function to set the new access token and refresh token in the cookie.
   *
   * If the access token is not expired, it calls the `setAuthUser` function
   * to set the access token and refresh token in the cookie.
   */
  const access_token = Cookie.get("access_token");
  const refresh_token = Cookie.get("refresh_token");

  if (!access_token || !refresh_token) {
    return;
  }

  if (isAccessTokenExpired(access_token)) {
    const response = await getRefreshedToken(refresh_token);
    setAuthUser(response.access, response.refresh);
  } else {
    setAuthUser(access_token, refresh_token);
  }
};

export const setAuthUser = (access_token, refresh_token) => {
  /**
   * This function sets the access token and refresh token in the cookie.
   * It sets the access token to expire in 1 day and the refresh token to
   * expire in 7 days. It also decodes the access token to get the user
   * data and sets the user data in the store. It then sets the loading
   * state to false.
   */
  Cookie.set("access_token", access_token, {
    expires: 1,
    secure: true,
  });

  Cookie.set("refresh_token", refresh_token, {
    expires: 7,
    secure: true,
  });

  const user = jwt_decode(access_token) ?? null;

  if (user) {
    useAuthStore.getState().setUser(user);
  }
  useAuthStore.getState().setLoading(false);
};

export const getRefreshedToken = async () => {
  const refresh_token = Cookie.get("refresh_token");
  const response = await axios.post(`user/token/refresh/`, {
    refresh: refresh_token,
  });
  return response.data;
};

export const isAccessTokenExpired = (access_token) => {
  try {
    /**
     * This function takes an access token and checks if it has expired.
     * It decodes the access token using the `jwt_decode` function from the
     * `jwt-decode` library. The decoded token contains the expiration time
     * of the token in seconds. We compare the expiration time with the current
     * time in seconds and return true if the token has expired and false
     * otherwise.
     */
    const decodedToken = jwt_decode(access_token);
    return decodedToken.exp < Date.now() / 1000;
  } catch (error) {
    console.log(error);
    /**
     * If there is an error while decoding the token, we assume that the token
     * is invalid and return true. This prevents the user from accessing the
     * protected routes if the token is invalid.
     */
    return true;
  }
};
