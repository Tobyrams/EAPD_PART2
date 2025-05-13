import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error fetching profile:", error);
        } else if (profile?.role) {
          const role = profile.role === "employee" ? "Employee" : "Farmer";
          setUserRole(role);
        }
      }
    };
    getUser();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="navbar bg-base-100 shadow-lg">
      <div className="flex-1">
        <Link to="/dashboard" className="btn btn-ghost text-xl">
          Agri Connect
        </Link>
      </div>
      <div className="flex-none gap-2">
        <Link
          to="/dashboard"
          className={`btn ${
            isActive("/dashboard") ? "btn-primary" : "btn-ghost"
          }`}
        >
          Dashboard
        </Link>
        <Link
          to="/products"
          className={`btn ${
            isActive("/products") ? "btn-primary" : "btn-ghost"
          }`}
        >
          Products
        </Link>

        <div className="dropdown dropdown-end">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-circle avatar"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className="w-10 rounded-full">
              <div className="bg-primary text-primary-content flex items-center justify-center h-full text-xl">
                {user?.email?.[0]?.toUpperCase() || "U"}
              </div>
            </div>
          </div>
          {isProfileOpen && (
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow"
            >
              <li className="menu-title px-4 py-2">
                <div className="flex flex-col">
                  <p className="text-sm font-semibold">{user?.email}</p>
                  <p className="text-xs text-base-content/70">
                    {userRole || "Farmer"}
                  </p>
                </div>
              </li>

              <li>
                <button onClick={handleSignOut} className="text-error">
                  Logout
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
