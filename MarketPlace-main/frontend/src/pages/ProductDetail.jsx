import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import api from '../utils/api';
import { toast } from 'sonner';
import { ShoppingCart, Star, Package, ShieldCheck, Heart } from 'lucide-react';

const ProductDetail = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/products/${id}`);
      setProduct(response.data);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const response = await api.get(`/reviews/${id}`);
      setReviews(response.data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      toast.error('Please login to purchase');
      navigate('/login');
      return;
    }

    if (user.role !== 'buyer') {
      toast.error('Only buyers can purchase products');
      return;
    }

    try {
      const response = await api.post(`/orders?product_id=${id}&quantity=${quantity}`);
      toast.success('Order created! Redirecting to checkout...');
      navigate(`/checkout/${response.data.id}`);
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error(error.response?.data?.detail || 'Failed to create order');
    }
  };

  const handleAddToWishlist = async () => {
    if (!user) {
      toast.error('Please login first');
      navigate('/login');
      return;
    }

    try {
      await api.post(`/wishlist/${id}`);
      toast.success('Added to wishlist');
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast.error('Failed to add to wishlist');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <Package size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">Product not found</p>
        </div>
      </div>
    );
  }

  const images = product.images?.length > 0 ? product.images : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'];

  return (
    <div className="min-h-[calc(100vh-4rem)] py-10">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-xl overflow-hidden bg-muted" data-testid="product-main-image">
              <img
                src={images[selectedImage]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className={`aspect-square rounded-lg overflow-hidden cursor-pointer border-2 ${
                      selectedImage === idx ? 'border-primary' : 'border-transparent'
                    }`}
                    onClick={() => setSelectedImage(idx)}
                    data-testid={`product-thumbnail-${idx}`}
                  >
                    <img src={img} alt={`${product.title} ${idx + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4 mb-2">
                <h1 className="text-3xl font-semibold" data-testid="product-title">{product.title}</h1>
                {product.verified && <ShieldCheck className="text-emerald-500 flex-shrink-0" size={24} />}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>By {product.seller_name}</span>
                {product.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star size={14} fill="currentColor" className="text-amber-500" />
                    <span>{product.rating} ({product.reviews_count} reviews)</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div>
              <div className="text-3xl font-bold" data-testid="product-price">${product.price.toFixed(2)}</div>
              <Badge className="mt-2">{product.category}</Badge>
            </div>

            {product.stock > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium">Quantity:</label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      data-testid="decrease-quantity"
                    >
                      -
                    </Button>
                    <span className="w-12 text-center" data-testid="quantity-display">{quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      data-testid="increase-quantity"
                    >
                      +
                    </Button>
                  </div>
                  <span className="text-sm text-muted-foreground">({product.stock} available)</span>
                </div>

                <div className="flex gap-3">
                  <Button className="flex-1" onClick={handleBuyNow} data-testid="buy-now-button">
                    <ShoppingCart size={18} className="mr-2" />
                    Buy Now
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleAddToWishlist} data-testid="wishlist-button">
                    <Heart size={18} />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-destructive/10 rounded-lg" data-testid="out-of-stock">
                <p className="text-destructive font-medium">Out of Stock</p>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="description" className="mt-12">
          <TabsList>
            <TabsTrigger value="description" data-testid="tab-description">Description</TabsTrigger>
            <TabsTrigger value="reviews" data-testid="tab-reviews">Reviews ({reviews.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground leading-7" data-testid="product-description">{product.description}</p>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="reviews" className="mt-6">
            <div className="space-y-4">
              {reviews.length > 0 ? (
                reviews.map((review) => (
                  <Card key={review.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>{review.user_name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{review.user_name}</p>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={14}
                                  fill={i < review.rating ? 'currentColor' : 'none'}
                                  className={i < review.rating ? 'text-amber-500' : 'text-muted-foreground'}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{review.comment}</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No reviews yet. Be the first to review this product!
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProductDetail;