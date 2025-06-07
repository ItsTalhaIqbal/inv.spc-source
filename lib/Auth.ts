import cookie from "js-cookie";
import axios from "axios";


const TOKEN_KEY = "token";
const USER_KEY = "user";


export const setCookie = (key:string, value:string) => {
  cookie.set(key, value); 
};

export const removeCookie = (key:string) => {
  cookie.remove(key);
};

export const getCookie = (key:string) => {
  return cookie.get(key);
};

export const setAuthentication = (token:string) => {
  setCookie(TOKEN_KEY, token);
};

export const logOut = () => {
  removeCookie(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const isLogin = async (): Promise<{
  username: string;
  email: string;
  userId: string;
  role?: string; // Add role if available
} | null> => {
  const token = getCookie(TOKEN_KEY);
  
  if (!token) return null;

  try {
    const res = await axios.post(`/api/invoice/auth`, { 
      action: "tokenAuth", 
      token 
    });

    if (res.data?.data) {
      const { data } = res.data;
      const userData = { 
        name: data.username, 
        email: data.email, 
        Id: data.userId,
        role: data.role // Make sure to include role if needed
      };
      
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      return data;
    }
    return null;
  } catch (error) {
    console.error("Authentication failed:", error);
    // Clean up invalid session
    logOut();
    return null;
  }
};