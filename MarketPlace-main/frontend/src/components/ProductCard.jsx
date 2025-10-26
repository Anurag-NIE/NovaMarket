import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardContent, CardFooter } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ShieldCheck, Star } from 'lucide-react';

const ProductCard = ({ product }) => {
  const navigate = useNavigate();

  return (
    <Card
      className="group rounded-xl overflow-hidden border bg-card hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={() => navigate(`/product/${product.id}`)}
      data-testid="product-card"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={product.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          loading="lazy"
        />
        {product.verified && (
          <ShieldCheck
            className="absolute right-2 top-2 text-emerald-500"
            size={20}
            aria-label="Verified seller"
          />
        )}
      </div>
      <CardHeader className="p-3">
        <div className="text-sm font-medium line-clamp-2" title={product.title}>
          {product.title}
        </div>
      </CardHeader>
      <CardContent className="px-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="text-base font-semibold">${product.price.toFixed(2)}</div>
          {product.rating > 0 && (
            <div className="flex items-center gap-1 text-amber-500" aria-label="rating">
              <Star size={14} fill="currentColor" />
              <span className="text-xs text-foreground/70">{product.rating}</span>
            </div>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-1">By {product.seller_name}</div>
      </CardContent>
      <CardFooter className="px-3 pb-3">
        <Badge variant="secondary" className="text-xs">{product.category}</Badge>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;