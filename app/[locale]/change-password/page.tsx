"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getBasePath } from "@/lib/utils";

interface User {
  email: string;
  username?: string;
}

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const { theme } = useTheme();
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem("user") || "null");
    if (currentUser?.email) {
      setUser(currentUser);
    } else {
      setError("No user found. Please log in.");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    setLoading(true);
    e.preventDefault();
    setMessage("");
    setError("");

    if (!user?.email) {
      setError("User not authenticated. Please log in.");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match");
      setLoading(false);

      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long");
      setLoading(false);

      return;
    }

    try {
      const res = await fetch("/api/invoice/auth/changePassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        const basePath = getBasePath();
          router.push(basePath||"/"); 
      } else {
        setError(data.message);
      }
    } catch (err) {
      setLoading(false);

      console.error("Fetch error:", err); // Debugging
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground transition-colors duration-300">
      <div className="p-8 rounded-md shadow-sm w-full max-w-md bg-card border border-border">
        <h1 className="text-2xl font-bold mb-6 text-center">Change Password</h1>
        {message && (
          <p className="text-green-500 mb-4 text-center">{message}</p>
        )}
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium mb-1"
            >
              Current Password
            </label>
            <Input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-input text-foreground border-input"
              required
            />
          </div>
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium mb-1"
            >
              New Password
            </label>
            <Input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-input text-foreground border-input"
              required
            />
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium mb-1"
            >
              Confirm Password
            </label>
            <Input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-input text-foreground border-input"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-gray-600 text-white hover:bg-gray-700"
            disabled={!user}
          >
           {loading?"Processing...":"Change Password"} 
          </Button>
        </form>
      </div>
    </div>
  );
}
