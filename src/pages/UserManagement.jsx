import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { createClient } from "@supabase/supabase-js";
import toast from "react-hot-toast";

// Create a new Supabase client with service role key for admin operations
const supabaseAdmin = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "farmer",
  });

  // Fetch all users and their profiles
  const fetchUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(profiles);
    } catch (error) {
      toast.error("Error fetching users");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle new user creation
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    console.log("Creating user with role:", formData.role);

    try {
      // Create the auth user without signing in using admin client
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.admin.createUser({
          email: formData.email,
          password: formData.password,
          email_confirm: true, // Auto-confirm the email
          user_metadata: {
            role: formData.role,
          },
        });

      if (authError) throw authError;

      toast.success(
        `User ${formData.email} created successfully. They can now log in with their credentials.`
      );
      setIsModalOpen(false);
      setFormData({ email: "", password: "", role: "farmer" });
      fetchUsers();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">User Management</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
        >
          Add New User
        </button>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex justify-center">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.full_name}</td>
                  <td>
                    <span
                      className={`badge ${
                        user.role === "employee"
                          ? "badge-primary"
                          : "badge-secondary"
                      }`}
                    >
                      {user.role === "employee" ? "Employee" : "Farmer"}
                    </span>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create User Modal */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Create New User</h3>
            <form onSubmit={handleCreateUser}>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <input
                  type="email"
                  className="input input-bordered"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Password</span>
                </label>
                <input
                  type="password"
                  className="input input-bordered"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Role</span>
                </label>
                <select
                  className="select select-bordered"
                  value={formData.role}
                  onChange={(e) => {
                    console.log("Selected role:", e.target.value);
                    setFormData({ ...formData, role: e.target.value });
                  }}
                >
                  <option value="farmer">Farmer</option>
                  <option value="employee">Employee</option>
                </select>
              </div>
              <div className="modal-action">
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setIsModalOpen(false);
                    setFormData({ email: "", password: "", role: "farmer" });
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
