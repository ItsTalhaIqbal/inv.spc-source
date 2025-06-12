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
import CreateUserDialog from "@/components/createUserDialog";
import { isLogin } from "@/lib/Auth";
import { useRouter } from "next/navigation";

interface Bill {
  amount: number;
  dueDate: Date;
  description: string;
  paid: boolean;
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  state: string;
  country: string;
  bills: Bill[];
}

const Page = () => {
  const { theme } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await isLogin();
        if (!user || user?.role !== "admin") {
          const isProduction = process.env.NODE_ENV === "production";
          const loginPath = isProduction ? "/en/login" : "/login";
          router.push(loginPath);
          return;
        }
        setAuthChecked(true);
        fetchUsers();
      } catch (error) {
        console.error("Authentication error:", error);
        const isProduction = process.env.NODE_ENV === "production";
        const loginPath = isProduction ? "/en/login" : "/login";
        router.push(loginPath);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/invoice/customer", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("Invalid data format received");
      }
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      alert(error instanceof Error ? error.message : "Failed to fetch users");
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const results = users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(results);
  }, [searchTerm, users]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleEdit = (user: User) => {
    setEditUser(user);
    setEditDialogOpen(true);
  };

  const handleDelete = (user: User) => {
    setDeleteUser(user);
    setDeleteDialogOpen(true);
  };

  const confirmEdit = async () => {
    if (!editUser) return;
    try {
      const response = await fetch(`/api/invoice/customer`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editUser),
      });
      if (!response.ok) {
        throw new Error("Failed to update user");
      }
      await fetchUsers();
      setEditDialogOpen(false);
      setEditUser(null);
    } catch (error) {
      console.error("Error updating user:", error);
      alert(error instanceof Error ? error.message : "Failed to update user");
    }
  };

  const confirmDelete = async () => {
    if (!deleteUser) return;
    try {
      const response = await fetch(`/api/invoice/customer?id=${deleteUser._id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to delete user");
      }
      await fetchUsers();
      setDeleteDialogOpen(false);
      setDeleteUser(null);
    } catch (error) {
      console.error("Error deleting user:", error);
      alert(error instanceof Error ? error.message : "Failed to delete user");
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editUser) {
      setEditUser({
        ...editUser,
        [e.target.name]: e.target.value,
      });
    }
  };

  if (!authChecked) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto transition-colors duration-300">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Customer Management</h1>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={searchTerm}
            onChange={handleSearch}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center text-lg text-muted-foreground mt-8">
          No customers available
        </div>
      ) : (
        <Table className={filteredUsers.length > 0 ? "w-full" : "w-1/2 mx-auto"}>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user._id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.phone}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleEdit(user)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(user)}>
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

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4">
              {Object.entries(editUser).map(([key, value]) => {
                if (key === "_id" || key === "bills") return null;
                return (
                  <div key={key}>
                    <label className="block text-sm font-medium capitalize">
                      {key}
                    </label>
                    <Input
                      name={key}
                      value={value as string}
                      onChange={handleEditChange}
                    />
                  </div>
                );
              })}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={confirmEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete {deleteUser?.name}?</p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Page;
