import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Search,
  MessageCircle,
  DollarSign,
  Star,
  Edit,
  Trash2,
  Briefcase,
  ShieldCheck,
} from "lucide-react";
import api from "@/utils/api";
import { toast } from "sonner";

const categories = [
  "Web Development",
  "Mobile Development",
  "Graphic Design",
  "Content Writing",
  "Digital Marketing",
  "Video Editing",
  "Photography",
  "Virtual Assistant",
  "Consulting",
  "Translation",
];

const ServicesPage = ({ user }) => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const isSeller = user?.role === "seller";

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    image: "",
    tags: "",
  });

  useEffect(() => {
    fetchServices();
  }, [selectedCategory]);

  // Fetch services
  const fetchServices = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory) params.category = selectedCategory;
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;
      if (searchTerm) params.search = searchTerm;

      const response = await api.get("/services", { params });
      setServices(response.data);
    } catch (error) {
      console.error("Failed to fetch services:", error);
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = async (e) => {
    e.preventDefault();
    fetchServices();
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "",
      price: "",
      image: "",
      tags: "",
    });
    setEditingService(null);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        image: formData.image || null,
        tags: formData.tags
          ? formData.tags.split(",").map((t) => t.trim())
          : [],
      };

      if (editingService) {
        await api.put(`/services/${editingService.id}`, payload);
        toast.success("Service updated successfully!");
      } else {
        await api.post("/services", payload);
        toast.success("Service created successfully!");
      }

      setDialogOpen(false);
      resetForm();
      fetchServices();
    } catch (error) {
      console.error("Error saving service:", error);
      toast.error(error.response?.data?.detail || "Failed to save service");
    }
  };

  // Handle edit
  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      title: service.title,
      description: service.description,
      category: service.category,
      price: service.price.toString(),
      image: service.image || "",
      tags: service.tags.join(", "),
    });
    setDialogOpen(true);
  };

  // Handle delete
  const handleDelete = async (serviceId) => {
    if (!window.confirm("Are you sure you want to delete this service?"))
      return;

    try {
      await api.delete(`/services/${serviceId}`);
      toast.success("Service deleted successfully!");
      fetchServices();
    } catch (error) {
      console.error("Error deleting service:", error);
      toast.error(error.response?.data?.detail || "Failed to delete service");
    }
  };

  // Navigate to chat with seller
  const handleMessageSeller = (sellerId) => {
    navigate(`/chat?user=${sellerId}`);
  };

  // Handle booking
  const handleBookService = async (serviceId) => {
    if (!user) {
      toast.error("Please login to book services");
      navigate("/login");
      return;
    }

    if (user.role !== "buyer") {
      toast.error("Only buyers can book services");
      return;
    }

    try {
      const response = await api.post(`/services/${serviceId}/book`);
      toast.success("Service booked successfully! Check your orders.");
      navigate("/buyer-dashboard");
    } catch (error) {
      console.error("Error booking service:", error);
      toast.error(error.response?.data?.detail || "Failed to book service");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-[linear-gradient(120deg,hsl(202_84%_96%)_0%,hsl(35_92%_96%)_50%,hsl(160_60%_96%)_100%)] dark:bg-[linear-gradient(120deg,hsl(202_84%_15%)_0%,hsl(35_92%_15%)_50%,hsl(160_60%_15%)_100%)] py-16">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl tracking-tight font-semibold"
              data-testid="services-hero-title"
            >
              Professional Services
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Find expert freelancers and service providers for your projects
            </p>

            {/* Search Bar */}
            <form
              onSubmit={handleSearch}
              className="max-w-2xl mx-auto flex gap-2"
            >
              <div className="flex-1 relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={18}
                />
                <Input
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-input"
                />
              </div>
              <Button type="submit" data-testid="search-button">
                Search
              </Button>
            </form>

            {isSeller && (
              <div className="pt-4">
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="lg"
                      onClick={resetForm}
                      data-testid="add-service-button"
                    >
                      <Plus className="mr-2" size={18} />
                      Add Service
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>
                        {editingService ? "Edit Service" : "Create New Service"}
                      </DialogTitle>
                    </DialogHeader>
                    <form
                      onSubmit={handleSubmit}
                      className="space-y-4"
                      data-testid="service-form"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="title">Service Title*</Label>
                        <Input
                          id="title"
                          value={formData.title}
                          onChange={(e) =>
                            setFormData({ ...formData, title: e.target.value })
                          }
                          required
                          data-testid="service-title-input"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description*</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                          rows={4}
                          required
                          data-testid="service-description-input"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="category">Category*</Label>
                          <Select
                            value={formData.category}
                            onValueChange={(value) =>
                              setFormData({ ...formData, category: value })
                            }
                            required
                          >
                            <SelectTrigger data-testid="service-category-select">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {cat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="price">Price (USD)*</Label>
                          <Input
                            id="price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.price}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                price: e.target.value,
                              })
                            }
                            required
                            data-testid="service-price-input"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="image">Image URL (optional)</Label>
                        <Input
                          id="image"
                          value={formData.image}
                          onChange={(e) =>
                            setFormData({ ...formData, image: e.target.value })
                          }
                          placeholder="https://example.com/image.jpg"
                          data-testid="service-image-input"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tags">Tags (comma-separated)</Label>
                        <Input
                          id="tags"
                          value={formData.tags}
                          onChange={(e) =>
                            setFormData({ ...formData, tags: e.target.value })
                          }
                          placeholder="react, nodejs, api"
                          data-testid="service-tags-input"
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          className="flex-1"
                          data-testid="submit-service-button"
                        >
                          {editingService ? "Update Service" : "Create Service"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Filters & Services */}
      <section className="py-10 md:py-14">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
            <Badge
              variant={!selectedCategory ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => setSelectedCategory("")}
              data-testid="category-all"
            >
              All Services
            </Badge>
            {categories.map((cat) => (
              <Badge
                key={cat}
                variant={selectedCategory === cat ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setSelectedCategory(cat)}
                data-testid={`category-${cat
                  .toLowerCase()
                  .replace(/\s+/g, "-")}`}
              >
                {cat}
              </Badge>
            ))}
          </div>

          {/* Price Filter */}
          <div className="flex gap-3 mb-6">
            <Input
              type="number"
              placeholder="Min price"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-32"
              data-testid="min-price-input"
            />
            <Input
              type="number"
              placeholder="Max price"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-32"
              data-testid="max-price-input"
            />
            <Button
              variant="outline"
              onClick={fetchServices}
              data-testid="apply-filters-button"
            >
              Apply Filters
            </Button>
          </div>

          {/* Services Grid */}
          {loading ? (
            <div className="text-center py-20" data-testid="loading-spinner">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-4 text-muted-foreground">Loading services...</p>
            </div>
          ) : services.length > 0 ? (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6"
              data-testid="services-grid"
            >
              {services.map((service) => (
                <Card
                  key={service.id}
                  className="group rounded-xl overflow-hidden border bg-card hover:shadow-md transition-shadow duration-200"
                  data-testid="service-card"
                >
                  {service.image && (
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      <img
                        src={service.image}
                        alt={service.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <CardHeader className="p-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <h3
                          className="font-semibold text-lg line-clamp-2"
                          title={service.title}
                        >
                          {service.title}
                        </h3>
                        <Badge variant="secondary" className="mt-2">
                          {service.category}
                        </Badge>
                      </div>
                      {service.seller_id === user?.id && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(service)}
                            data-testid="edit-service-button"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(service.id)}
                            data-testid="delete-service-button"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-2">
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {service.description}
                    </p>

                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign size={16} className="text-emerald-600" />
                      <span className="font-bold text-lg">
                        ${service.price.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>By {service.seller_name}</span>
                      {service.rating > 0 && (
                        <>
                          <span>•</span>
                          <Star
                            size={14}
                            className="fill-yellow-400 text-yellow-400"
                          />
                          <span>{service.rating}</span>
                        </>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="px-4 pb-4">
                    {service.seller_id !== user?.id ? (
                      <div className="flex gap-2 w-full">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleMessageSeller(service.seller_id)}
                          data-testid="message-seller-button"
                        >
                          <MessageCircle size={16} className="mr-1" />
                          Message
                        </Button>
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleBookService(service.id)}
                          data-testid="book-service-button"
                        >
                          <Briefcase size={16} className="mr-1" />
                          Book
                        </Button>
                      </div>
                    ) : (
                      <div className="w-full text-center text-sm text-muted-foreground">
                        Your service
                      </div>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20" data-testid="empty-state">
              <Briefcase
                size={48}
                className="mx-auto text-muted-foreground mb-4"
              />
              <p className="text-lg font-medium">No services found</p>
              <p className="text-muted-foreground">
                {isSeller
                  ? "Create your first service to get started!"
                  : "Try adjusting your filters or search"}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default ServicesPage;
