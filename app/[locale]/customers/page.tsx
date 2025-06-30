"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, MoreHorizontal, Search } from "lucide-react";
import { isLogin } from "@/lib/Auth";
import { useRouter } from "next/navigation";

interface Bill {
  amount: number;
  dueDate: string;
  description: string;
  paid: boolean;
}

interface User {
  _id: string;
  name: string;
  email?: string;
  phone: string;
  address: string;
  state: string;
  country: string;
  bills: number[];
}

interface UserInput {
  _id: string;
  name: string;
  address: string;
  state: string;
  country: string;
  email?: string | null;
  phone: string;
}

const Page = () => {
  const { theme } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editId, setEditId] = useState("");
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editState, setEditState] = useState("");
  const [editCountry, setEditCountry] = useState("");
  const [deleteUserId, setDeleteUserId] = useState("");
  const [deleteUserName, setDeleteUserName] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const fetchUsers = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const response = await fetch("/api/invoice/customer", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Invalid data format");
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch users");
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const loggedIn = await isLogin();
        if (!loggedIn) {
          const isProduction = process.env.NODE_ENV === "production";
          const loginPath = isProduction ? "/en/login" : "/login";
          router.push(loginPath);
          return;
        }
        await fetchUsers();
      } catch (error) {
        console.error("Authentication error:", error);
        const isProduction = process.env.NODE_ENV === "production";
        const loginPath = isProduction ? "/en/login" : "/login";
        router.push(loginPath);
      }
    };
    checkAuth();
  }, [router]);

  useEffect(() => {
    const results = users.filter((user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(results);
  }, [searchTerm, users]);

  const handleEdit = (user: User) => {
    setEditId(user._id);
    setEditName(user.name);
    setEditEmail(user.email || "");
    setEditPhone(user.phone);
    setEditAddress(user.address);
    setEditState(user.state);
    setEditCountry(user.country);
    setError("");
    setEditDialogOpen(true);
  };

  const handleDelete = (user: User) => {
    setDeleteUserId(user._id);
    setDeleteUserName(user.name);
    setError("");
    setDeleteDialogOpen(true);
  };

  const confirmEdit = async () => {
    try {
      if (!editName.trim()) {
        setError("Name is required");
        return;
      }
      if (!editAddress.trim()) {
        setError("Address is required");
        return;
      }
      if (!editPhone.trim()) {
        setError("Phone Number is required");
        return;
      }
      if (editEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editEmail)) {
        setError("Invalid email format");
        return;
      }

      setEditLoading(true);
      const updateData: UserInput = {
        _id: editId,
        name: editName.trim(),
        phone: editPhone.trim(),
        address: editAddress.trim(),
        state: editState.trim(),
        country: editCountry.trim(),
        email: editEmail.trim() || null,
      };

      const response = await fetch("/api/invoice/customer", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update user");
      }
      await fetchUsers();
      setEditDialogOpen(false);
      setError("");
    } catch (error) {
      console.error("Error updating user:", error);
      setError(error instanceof Error ? error.message : "Failed to update user");
    } finally {
      setEditLoading(false);
    }
  };

  const confirmDelete = async () => {
    try {
      setDeleteLoading(true);
      const response = await fetch(`/api/invoice/customer?id=${deleteUserId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to delete user");
      await fetchUsers();
      setDeleteDialogOpen(false);
      setError("");
    } catch (error) {
      console.error("Error deleting user:", error);
      setError(error instanceof Error ? error.message : "Failed to delete user");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div
      className={`p-6 mt-4 max-w-6xl mx-[300px] ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black"
      }`}
    >
      <h1 className="text-2xl font-bold mb-4">Customer Management</h1>

      <div className="relative w-64 mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`pl-10 ${
            theme === "dark"
              ? "bg-gray-800 text-white border-gray-700"
              : "bg-white text-black border-gray-300"
          }`}
        />
      </div>

      {error && <div className="text-sm text-red-600 mb-4">{error}</div>}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2
            className={`h-8 w-8 animate-spin ${
              theme === "dark" ? "text-gray-300" : "text-gray-500"
            }`}
          />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div
          className={`text-center text-lg ${
            theme === "dark" ? "text-gray-300" : "text-gray-500"
          } mt-8`}
        >
          No customers available
        </div>
      ) : (
        <Table
          className={theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"}
        >
          <TableHeader>
            <TableRow className={theme === "dark" ? "bg-gray-700" : "bg-gray-100"}>
              <TableHead className={theme === "dark" ? "text-white" : "text-black"}>
                Name
              </TableHead>
              <TableHead className={theme === "dark" ? "text-white" : "text-black"}>
                Email
              </TableHead>
              <TableHead className={theme === "dark" ? "text-white" : "text-black"}>
                Phone
              </TableHead>
              <TableHead className={theme === "dark" ? "text-white" : "text-black"}>
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow
                key={user._id}
                className={theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50"}
              >
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email || ""}</TableCell>
                <TableCell>{user.phone}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={
                          theme === "dark"
                            ? "bg-gray-600 text-white hover:bg-gray-500"
                            : "bg-gray-200 text-black hover:bg-gray-300"
                        }
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className={theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-black"}
                    >
                      <DropdownMenuItem
                        onClick={() => handleEdit(user)}
                        className={theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50"}
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(user)}
                        className={theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50"}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent
          className={
            theme === "dark"
              ? "bg-gray-800 text-white border-gray-700"
              : "bg-white text-black border-gray-200"
          }
        >
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            {error && <div className="text-lg text-red-500">{error}</div>}
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className={
                  theme === "dark"
                    ? "bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
                    : "bg-white text-black border-gray-300 focus:ring-blue-500"
                }
                disabled={editLoading}
                placeholder="Enter name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Email (Optional)</label>
              <Input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className={
                  theme === "dark"
                    ? "bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
                    : "bg-white text-black border-gray-300 focus:ring-blue-500"
                }
                disabled={editLoading}
                placeholder="Enter email or leave empty"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Phone</label>
              <Input
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className={
                  theme === "dark"
                    ? "bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
                    : "bg-white text-black border-gray-300 focus:ring-blue-500"
                }
                disabled={editLoading}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Address</label>
              <Input
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                className={
                  theme === "dark"
                    ? "bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
                    : "bg-white text-black border-gray-300 focus:ring-blue-500"
                }
                disabled={editLoading}
                placeholder="Enter address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">State</label>
              <Input
                value={editState}
                onChange={(e) => setEditState(e.target.value)}
                className={
                  theme === "dark"
                    ? "bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
                    : "bg-white text-black border-gray-300 focus:ring-blue-500"
                }
                disabled={editLoading}
                placeholder="Enter state"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Country</label>
              <Input
                value={editCountry}
                onChange={(e) => setEditCountry(e.target.value)}
                className={
                  theme === "dark"
                    ? "bg-gray-700 text-white border-gray-600 focus:ring-blue-500"
                    : "bg-white text-black border-gray-300 focus:ring-blue-500"
                }
                disabled={editLoading}
                placeholder="Enter country"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setError("");
              }}
              className={
                theme === "dark"
                  ? "bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
                  : "bg-gray-200 text-black border-gray-300 hover:bg-gray-300"
              }
              disabled={editLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmEdit}
              className={
                theme === "dark"
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-gray-200 text-black hover:bg-gray-300"
              }
              disabled={editLoading}
            >
              {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent
          className={
            theme === "dark"
              ? "bg-gray-800 text-white border-gray-700"
              : "bg-white text-black border-gray-200"
          }
        >
          <DialogHeader>
            <DialogTitle>Delete Customer</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete {deleteUserName}?</p>
          {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setError("");
              }}
              className={
                theme === "dark"
                  ? "bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
                  : "bg-gray-200 text-black border-gray-300 hover:bg-gray-300"
              }
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className={
                theme === "dark"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-red-500 text-white hover:bg-red-600"
              }
              disabled={deleteLoading}
            >
              {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Page;