import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Leaf, Lock } from "lucide-react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    loginMutation.mutate(
      { data: { password } },
      {
        onSuccess: (data) => {
          login(data.token);
          setLocation("/");
        },
        onError: () => {
          toast({
            title: "Login gagal",
            description: "Password salah. Coba lagi.",
            variant: "destructive",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-md">
            <Leaf className="text-primary-foreground" size={28} />
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Sambelfarm</h1>
          <p className="text-muted-foreground text-sm mt-1 text-center">
            Content Lab — ruang kreatif untuk cerita yang bermakna
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  id="password"
                  data-testid="input-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="pl-10"
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              data-testid="button-login"
              className="w-full"
              disabled={loginMutation.isPending || !password.trim()}
            >
              {loginMutation.isPending ? "Masuk..." : "Masuk"}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Sambelfarm Content Lab &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
