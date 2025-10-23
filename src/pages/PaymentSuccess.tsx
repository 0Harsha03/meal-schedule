import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        toast({
          title: "Error",
          description: "No payment session found",
          variant: "destructive",
        });
        navigate("/order");
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error("Not authenticated");
        }

        const { data, error } = await supabase.functions.invoke("verify-payment", {
          body: { sessionId },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (error) throw error;

        if (data.paymentStatus === "paid") {
          setVerified(true);
          toast({
            title: "Payment Successful",
            description: "Your order has been confirmed!",
          });
        } else {
          throw new Error("Payment not completed");
        }
      } catch (error) {
        console.error("Error verifying payment:", error);
        toast({
          title: "Verification Error",
          description: "Could not verify payment status",
          variant: "destructive",
        });
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [sessionId, navigate, toast]);

  if (verifying) {
    return (
      <div className="container mx-auto max-w-2xl py-16 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              Verifying Payment
            </CardTitle>
            <CardDescription>Please wait while we confirm your payment...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl py-16 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-8 w-8" />
            Payment Successful!
          </CardTitle>
          <CardDescription>
            {verified
              ? "Your order has been confirmed and the kitchen has been notified."
              : "Your payment was processed successfully."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            You will receive a notification when your order is ready for pickup.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => navigate("/my-orders")} variant="default">
              View My Orders
            </Button>
            <Button onClick={() => navigate("/order")} variant="outline">
              Place Another Order
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
