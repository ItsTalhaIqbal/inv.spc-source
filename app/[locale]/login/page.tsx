"use client";
import React from "react";
import LoginForm from "../../components/invoice/form/LoginForm";
import { useTheme } from "next-themes";

type Props = {};

const Login = (props: Props) => {
  const {theme} = useTheme();
  return (
    <div className={theme == "dark" ? "bg-gray-800" : "bg-gray-400"}>
      <div className="flex items-center justify-center min-h-screen w-full border">
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;
