// // frontend/src/pages/Home.jsx - UPDATED
// // ADD THIS IMPORT at the top
// import RecommendationsFeed from "../components/RecommendationsFeed";
// // import { useAuth } from "../context/AuthContext"; // Assuming you have auth context

// // KEEP ALL YOUR EXISTING CODE for Hero, Search, Categories, etc.

// // ADD THIS SECTION before your footer (after your existing listings grid)
// const HomePage = () => {
//   const { user } = useAuth(); // Get current user

//   return (
//     <div>
//       {/* KEEP ALL YOUR EXISTING HERO, SEARCH, CATEGORIES CODE */}

//       {/* Your existing featured listings section */}
//       {/* ... existing code ... */}

//       {/* NEW: Add Recommendations Section */}
//       {user && (
//         <section className="container mx-auto px-4 py-12">
//           <RecommendationsFeed userId={user.id} />
//         </section>
//       )}

//       {/* KEEP YOUR EXISTING FOOTER */}
//     </div>
//   );
// };

// export default HomePage;

// // That's it! Minimal changes to Home page.
// // The recommendations will automatically show for logged-in users.





import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import ListingCard from '../components/ListingCard';
import api from '../utils/api';
import { Search, Package, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

const categories = ['Electronics', 'Fashion', 'Home', 'Books', 'Sports', 'Beauty', 'Toys', 'Services'];

const Home = ({ user }) => {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetchListings();
  }, [selectedCategory]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory) params.category = selectedCategory;
      const response = await api.get('/listings', { params });
      setListings(response.data);
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return;

    try {
      setLoading(true);
      const response = await api.get('/listings', { params: { search } });
      setListings(response.data);
    } catch (error) {
      console.error('Error searching listings:', error);
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-[linear-gradient(120deg,hsl(202_84%_96%)_0%,hsl(35_92%_96%)_50%,hsl(160_60%_96%)_100%)] dark:bg-[linear-gradient(120deg,hsl(202_84%_15%)_0%,hsl(35_92%_15%)_50%,hsl(160_60%_15%)_100%)] py-20">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl tracking-tight font-semibold" data-testid="hero-title">
              Discover New Listings
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Buy and sell new products and services in a trusted marketplace
            </p>

            <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  placeholder="Search listings..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  data-testid="search-input"
                />
              </div>
              <Button type="submit" data-testid="search-button">Search</Button>
            </form>

            {!user && (
              <div className="flex gap-3 justify-center pt-4">
                <Button size="lg" onClick={() => navigate('/register?role=buyer')} data-testid="buy-cta">
                  <ShoppingBag size={18} className="mr-2" />
                  Start Buying
                </Button>
                <Button size="lg" variant="secondary" onClick={() => navigate('/register?role=seller')} data-testid="sell-cta">
                  <Package size={18} className="mr-2" />
                  Start Selling
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Filters & Listings */}
      <section className="py-10 md:py-14">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
            <Badge
              variant={!selectedCategory ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setSelectedCategory('')}
              data-testid="category-all"
            >
              All
            </Badge>
            {categories.map((cat) => (
              <Badge
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setSelectedCategory(cat)}
                data-testid={`category-${cat.toLowerCase()}`}
              >
                {cat}
              </Badge>
            ))}
          </div>

          {/* Listings Grid */}
          {loading ? (
            <div className="text-center py-20" data-testid="loading-spinner">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-4 text-muted-foreground">Loading listings...</p>
            </div>
          ) : listings.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 md:gap-6" data-testid="listings-grid">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20" data-testid="empty-state">
              <Package size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No listings found</p>
              <p className="text-muted-foreground">Try adjusting your filters or search</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
