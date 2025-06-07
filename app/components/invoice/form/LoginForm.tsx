"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isLogin, setAuthentication } from "@/lib/Auth";
import axios, { AxiosError } from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface User {
  role?: string;
}

interface LoginResponse {
  token: string;
}

const LoginForm = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [redirecting, setRedirecting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [userData, setUserData] = useState<User | null>(null); // Store user data
  const [loginSuccess, setLoginSuccess] = useState<boolean>(false); // Track login success

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    if (!username.trim() || !password.trim()) {
      setErrorMsg("Please enter both username and password.");
      setLoading(false);
      return;
    }

    try {
      
      const data = { username, password, action: "login" };

      const res = await axios.post<LoginResponse>("/api/invoice/auth", data);
      const token = res.data.token;

      await setAuthentication(token);
        router.replace("/");

      // const user = await isLogin();
      // setUserData(user); // Store user data
      // setLoginSuccess(true); // Mark login as successful
      // setRedirecting(true); // Prepare for redirect (but not executing yet)

      // Temporarily disable redirect for debugging
      // setTimeout(() => {
      //   router.replace("/");
      // }, 2000); // Delay redirect to inspect logs
    } catch (error: any) {
      if (error instanceof AxiosError && error.response) {
        setErrorMsg(
          error.response.data?.error || "Invalid username or password."
        );
      } else {
        setErrorMsg("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Monitor redirecting state (optional, keep for manual redirect control)
  useEffect(() => {
    if (redirecting && loginSuccess) {
      // Uncomment below to enable redirect with delay
      // const timer = setTimeout(() => {
      //   router.replace("/");
      // }, 2000);
      // return () => clearTimeout(timer);
    }
  }, [redirecting, loginSuccess, router]);

  // Debugging: Log user data when it changes
  useEffect(() => {
    if (userData) {
    }
  }, [userData]);

  return (
    <div className="bg-slate-200 h-[340px] w-[400px] rounded-lg p-10">
      <h1 className="text-2xl font-bold text-gray-700 mb-4 text-center">
        Login to Your Account
      </h1>

      <form onSubmit={handleSubmit}>
        <Input
          className="my-5"
          value={username}
          placeholder="Enter username"
          onChange={(e) => setUsername(e.target.value)}
        />
        <Input
          className="my-5"
          type="password"
          value={password}
          placeholder="Enter Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        {errorMsg && (
          <p className="text-red-600 text-sm text-center mb-2">{errorMsg}</p>
        )}

        {loginSuccess && userData && (
          <div className="text-green-600 text-sm text-center mb-2">
            <p>Login successful!</p>
            <p>Role: {userData.role || "Not specified"}</p>
            <Button
              onClick={() => {
                router.replace("/");
              }}
              className="mt-2"
            >
              Go to Dashboard
            </Button>
          </div>
        )}


        <Button
          type="submit"
          disabled={loading || redirecting}
          className="bg-gray-700 rounded-sm text-white w-full mt-3 mb-8  hover:bg-slate-900"
        >
          {loading ? "Processing..." : "Login"}
        </Button>


      </form>
    </div>
  );
};

export default LoginForm;