import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedFarmer, setSelectedFarmer] = useState("");
  const [categories, setCategories] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    production_date: "",
  });

  // Get current user and role
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
          setUserRole(profile.role);
        }
      }
    };
    getUser();
  }, []);

  // Fetch farmers for employee filter
  const fetchFarmers = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("role", "farmer")
        .order("full_name");

      if (error) throw error;
      setFarmers(data);
    } catch (error) {
      console.error("Error fetching farmers:", error);
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    try {
      let query = supabase
        .from("products")
        .select(
          `
          *,
          profiles:farmer_id (
            full_name
          )
        `
        )
        .order("created_at", { ascending: false });

      // If user is a farmer, only show their products
      if (userRole === "farmer") {
        query = query.eq("farmer_id", user.id);
      }
      // If employee has selected a specific farmer, filter by that farmer
      else if (userRole === "employee" && selectedFarmer) {
        query = query.eq("farmer_id", selectedFarmer);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProducts(data);

      // Extract unique categories
      const uniqueCategories = [
        ...new Set(data.map((product) => product.category)),
      ];
      setCategories(uniqueCategories);
    } catch (error) {
      toast.error("Error fetching products");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    if (userRole === "employee") {
      fetchFarmers();
    }
  }, [userRole, selectedFarmer]);

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in to manage products");
      return;
    }

    try {
      if (editingProduct) {
        // Update existing product
        const { error } = await supabase
          .from("products")
          .update({
            name: formData.name,
            category: formData.category,
            production_date: formData.production_date,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingProduct.id)
          .eq("farmer_id", user.id); // Ensure user owns the product

        if (error) throw error;
        toast.success("Product updated successfully");
      } else {
        // Create new product
        const { error } = await supabase.from("products").insert([
          {
            name: formData.name,
            category: formData.category,
            production_date: formData.production_date,
            farmer_id: user.id, // Add the farmer_id
          },
        ]);

        if (error) throw error;
        toast.success("Product created successfully");
      }

      setIsModalOpen(false);
      setEditingProduct(null);
      setFormData({ name: "", category: "", production_date: "" });
      fetchProducts();
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id)
        .eq("farmer_id", user.id); // Ensure user owns the product

      if (error) throw error;
      toast.success("Product deleted successfully");
      fetchProducts();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    }
  };

  // Handle edit
  const handleEdit = (product) => {
    // Only allow editing if the user owns the product
    if (product.farmer_id !== user?.id) {
      toast.error("You can only edit your own products");
      return;
    }
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      production_date: product.production_date,
    });
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Products</h1>
        {userRole !== "employee" && (
          <button
            onClick={() => {
              setEditingProduct(null);
              setFormData({ name: "", category: "", production_date: "" });
              setIsModalOpen(true);
            }}
            className="btn btn-primary"
          >
            Add Product
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search products..."
          className="input input-bordered flex-1"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="select select-bordered"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        {userRole === "employee" && (
          <select
            className="select select-bordered"
            value={selectedFarmer}
            onChange={(e) => setSelectedFarmer(e.target.value)}
          >
            <option value="">All Farmers</option>
            {farmers.map((farmer) => (
              <option key={farmer.id} value={farmer.id}>
                {farmer.full_name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="flex justify-center">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Production Date</th>
                {userRole === "employee" && <th>Farmer</th>}
                {userRole !== "employee" && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>
                    {new Date(product.production_date).toLocaleDateString()}
                  </td>
                  {userRole === "employee" && (
                    <td>{product.profiles?.full_name}</td>
                  )}
                  <td>
                    <div className="flex gap-2">
                      {product.farmer_id === user?.id && (
                        <>
                          <button
                            onClick={() => handleEdit(product)}
                            className="btn btn-sm btn-ghost"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              setProductToDelete(product);
                              setIsDeleteModalOpen(true);
                            }}
                            className="btn btn-sm btn-ghost text-error"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">
              {editingProduct ? "Edit Product" : "Add New Product"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Category</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Production Date</span>
                </label>
                <input
                  type="date"
                  className="input input-bordered"
                  value={formData.production_date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      production_date: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="modal-action">
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingProduct(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && productToDelete && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Confirm Delete</h3>
            <p className="mb-4">
              Are you sure you want to delete the product "
              <b>{productToDelete.name}</b>"? This action cannot be undone.
            </p>
            <div className="modal-action">
              <button
                className="btn"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setProductToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-error"
                onClick={() => handleDelete(productToDelete.id)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
