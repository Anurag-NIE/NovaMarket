import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import api from '../utils/api';
import { CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (sessionId) {
      checkPaymentStatus();
    } else {
      setChecking(false);
    }
  }, [sessionId]);

  const checkPaymentStatus = async () => {
    let attempts = 0;
    const maxAttempts = 5;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setChecking(false);
        toast.error('Payment verification timed out');
        return;
      }

      try {
        const response = await api.get(`/checkout/status/${sessionId}`);
        setStatus(response.data);

        if (response.data.payment_status === 'paid') {
          setChecking(false);
          toast.success('Payment successful!');
          return;
        }

        if (response.data.status === 'expired') {
          setChecking(false);
          toast.error('Payment session expired');
          return;
        }

        attempts++;
        setTimeout(poll, 2000);
      } catch (error) {
        console.error('Error checking payment status:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);
        } else {
          setChecking(false);
          toast.error('Failed to verify payment');
        }
      }
    };

    poll();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-10">
      <div className="mx-auto max-w-[600px] px-4 sm:px-6 lg:px-8 w-full">
        <Card className="text-center" data-testid="payment-success-card">
          <CardHeader>
            {checking ? (
              <>
                <Loader2 size={48} className="mx-auto text-primary animate-spin mb-4" />
                <h2 className="text-2xl font-semibold">Verifying Payment</h2>
                <p className="text-muted-foreground">Please wait while we confirm your payment...</p>
              </>
            ) : status?.payment_status === 'paid' ? (
              <>
                <CheckCircle size={48} className="mx-auto text-emerald-500 mb-4" />
                <h2 className="text-2xl font-semibold text-emerald-500">Payment Successful!</h2>
                <p className="text-muted-foreground">Thank you for your purchase</p>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-semibold">Payment Verification</h2>
                <p className="text-muted-foreground">Unable to verify payment status</p>
              </>
            )}
          </CardHeader>
          {!checking && (
            <CardContent className="space-y-3">
              <Button onClick={() => navigate('/buyer-dashboard')} className="w-full" data-testid="view-orders-button">
                View My Orders
              </Button>
              <Button variant="outline" onClick={() => navigate('/')} className="w-full" data-testid="continue-shopping-button">
                Continue Shopping
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
};

export default PaymentSuccess;