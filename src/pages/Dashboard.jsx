import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  return (
    <div className="container mx-auto p-4">
      <div className="bg-base-200 p-6 rounded-lg">
        <h2 className="text-xl mb-4">Welcome, {user?.email}</h2>
        <p>This is your protected dashboard page.</p>
      </div>
    </div>
  );
}
