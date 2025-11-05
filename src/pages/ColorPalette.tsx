import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Palette, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ColorPalette = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [copiedColor, setCopiedColor] = useState<string>('');
  const navigate = useNavigate();

  const hslToHex = (hsl: string): string => {
    const match = hsl.match(/hsl\(([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\)/);
    if (!match) return '#000000';
    
    const h = parseFloat(match[1]) / 360;
    const s = parseFloat(match[2]) / 100;
    const l = parseFloat(match[3]) / 100;
    
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    const toHex = (x: number) => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  };

  const hslToRgb = (hsl: string): string => {
    const match = hsl.match(/hsl\(([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\)/);
    if (!match) return 'rgb(0, 0, 0)';
    
    const h = parseFloat(match[1]) / 360;
    const s = parseFloat(match[2]) / 100;
    const l = parseFloat(match[3]) / 100;
    
    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    
    return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
  };

  const colors = [
    { name: 'Primary (Brand Blue)', var: '--primary', value: 'hsl(221.2 83.2% 53.3%)' },
    { name: 'Background (White)', var: '--background', value: 'hsl(0 0% 100%)' },
    { name: 'Foreground (Dark Text)', var: '--foreground', value: 'hsl(222.2 84% 4.9%)' },
    { name: 'Secondary (Light Gray)', var: '--secondary', value: 'hsl(210 40% 96.1%)' },
    { name: 'Muted Foreground (Gray Text)', var: '--muted-foreground', value: 'hsl(215.4 16.3% 46.9%)' },
    { name: 'Border (Light Gray)', var: '--border', value: 'hsl(214.3 31.8% 91.4%)' },
    { name: 'Destructive (Red)', var: '--destructive', value: 'hsl(0 84.2% 60.2%)' }
  ];

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error('Access denied');
      navigate('/');
      return;
    }

    const { data } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!data) {
      toast.error('Admin access required');
      navigate('/');
      return;
    }

    setIsAdmin(true);
    setLoading(false);
  };

  const copyToClipboard = (colorVar: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedColor(colorVar);
    toast.success('Color copied to clipboard');
    setTimeout(() => setCopiedColor(''), 2000);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!isAdmin) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <Card className="w-full max-w-md mx-4">
            <CardHeader className="text-center">
              <CardTitle>Admin Access Required</CardTitle>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/")} variant="outline" className="w-full">
                Return Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <section className="relative h-[200px] flex items-center justify-center overflow-hidden bg-gradient-to-r from-primary to-primary/80">
        <div className="relative z-10 text-center text-primary-foreground px-4">
          <Palette className="w-12 h-12 mx-auto mb-3" />
          <h1 className="font-display text-4xl md:text-5xl font-bold">Color Palette</h1>
          <p className="text-sm mt-2 opacity-90">Admin Only - Website Color System</p>
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Theme Colors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                These are the semantic color tokens used throughout the website. Click any color to copy its value.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {colors.map((color) => (
                  <Card 
                    key={color.var}
                    className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group"
                    onClick={() => copyToClipboard(color.var, color.value)}
                  >
                    <div 
                      className="h-24 w-full transition-transform group-hover:scale-105"
                      style={{ background: color.value }}
                    />
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-sm mb-2">{color.name}</p>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                              <span className="font-semibold">Hex:</span>{' '}
                              <span className="font-mono">{hslToHex(color.value)}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <span className="font-semibold">RGB:</span>{' '}
                              <span className="font-mono">{hslToRgb(color.value)}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <span className="font-semibold">HSL:</span>{' '}
                              <span className="font-mono break-all">{color.value}</span>
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="flex-shrink-0 ml-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(color.var, color.value);
                          }}
                        >
                          {copiedColor === color.var ? (
                            <Check className="w-4 h-4 text-primary" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usage Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Primary:</strong> Main brand color for important actions and highlights
              </p>
              <p>
                <strong className="text-foreground">Secondary:</strong> Supporting color for less prominent elements
              </p>
              <p>
                <strong className="text-foreground">Accent:</strong> For highlighting and drawing attention
              </p>
              <p>
                <strong className="text-foreground">Muted:</strong> For subtle, background elements
              </p>
              <p>
                <strong className="text-foreground">Destructive:</strong> For warnings and delete actions
              </p>
              <p className="pt-4 border-t">
                To use these colors in Tailwind classes, use: <code className="bg-muted px-2 py-1 rounded">bg-primary</code>, <code className="bg-muted px-2 py-1 rounded">text-foreground</code>, etc.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </AdminLayout>
  );
};

export default ColorPalette;