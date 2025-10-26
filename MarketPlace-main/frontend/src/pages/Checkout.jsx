import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import api from '../utils/api';
import { toast } from 'sonner';
import { CreditCard, Loader2 } from 'lucide-react';

const Checkout = ({ user }) => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await api.get('/orders');
      const foundOrder = response.data.find(o => o.id === orderId);
      if (foundOrder) {
        setOrder(foundOrder);
      } else {
        toast.error('Order not found');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const response = await api.post(`/checkout/session?order_id=${orderId}`);
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error(error.response?.data?.detail || 'Payment failed');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <p className="text-lg">Order not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-10">
      <div className="mx-auto max-w-[600px] px-4 sm:px-6 lg:px-8">
        <Card data-testid="checkout-card">
          <CardHeader>
            <h2 className="text-2xl font-semibold">Checkout</h2>
            <p className="text-sm text-muted-foreground">Complete your purchase</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Product</span>
                <span className="font-medium" data-testid="order-product">{order.product_title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity</span>
                <span data-testid="order-quantity">{order.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Seller</span>
                <span>{order.seller_id}</span>
              </div>
              <div className="h-px bg-border my-4"></div>
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span data-testid="order-total">${order.total_amount.toFixed(2)}</span>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handlePayment}
              disabled={processing || order.payment_status === 'paid'}
              data-testid="pay-button"
            >
              {processing ? (
                <>
                  <Loader2 size={18} className="mr-2 animate-spin" />
                  Processing...
                </>
              ) : order.payment_status === 'paid' ? (
                'Payment Completed'
              ) : (
                <>
                  <CreditCard size={18} className="mr-2" />
                  Pay ${order.total_amount.toFixed(2)}
                </>
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Secure payment powered by Stripe
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Checkout;