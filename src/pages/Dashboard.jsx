import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("farmer_id", user.id)
        .order("created_at", { ascending: false });
      if (!error && data) {
        setProducts(data);
        setCategories([...new Set(data.map((p) => p.category))]);
      }
      setLoading(false);
    };
    if (user) fetchProducts();
  }, [user]);

  // Summary values
  const totalProducts = products.length;
  const totalCategories = categories.length;
  const newestProduct = products[0];
  const recentProducts = products.slice(0, 5);

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1">Product Summary</h2>
        <p className="text-base-content/70 mb-6">Overview of your products</p>
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 bg-base-200 rounded-lg p-6">
            <div className="text-base-content/70 font-semibold mb-1">
              Total Products
            </div>
            <div className="text-3xl font-bold">{totalProducts}</div>
          </div>
          <div className="flex-1 bg-base-200 rounded-lg p-6">
            <div className="text-base-content/70 font-semibold mb-1">
              Categories
            </div>
            <div className="text-3xl font-bold">{totalCategories}</div>
          </div>
          <div className="flex-1 bg-base-200 rounded-lg p-6">
            <div className="text-base-content/70 font-semibold mb-1">
              Newest Product
            </div>
            <div className="text-2xl font-bold">
              {newestProduct ? newestProduct.name : "-"}
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold mb-2">Recent Products</h3>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center">
                      <span className="loading loading-spinner loading-md"></span>
                    </td>
                  </tr>
                ) : recentProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  recentProducts.map((product) => (
                    <tr key={product.id}>
                      <td>{product.name}</td>
                      <td>{product.category}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <a href="/products" className="btn btn-outline">
              View All Products
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
