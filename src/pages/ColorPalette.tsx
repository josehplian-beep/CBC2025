import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Palette, Copy, Check, Download } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const ColorPalette = () => {
  const [copiedColor, setCopiedColor] = useState<string>('');
  const [downloading, setDownloading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const downloadPdf = async () => {
    if (!printRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save('color-palette.pdf');
      toast.success('PDF downloaded');
    } catch (e) {
      toast.error('Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

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

  const hslToRgbValues = (hsl: string): [number, number, number] => {
    const match = hsl.match(/hsl\(([\d.]+)\s+([\d.]+)%\s+([\d.]+)%\)/);
    if (!match) return [0, 0, 0];
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
    return [r * 255, g * 255, b * 255];
  };

  const relativeLuminance = ([r, g, b]: [number, number, number]) => {
    const channel = (c: number) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  };

  const contrastRatio = (a: [number, number, number], b: [number, number, number]) => {
    const l1 = relativeLuminance(a);
    const l2 = relativeLuminance(b);
    const [light, dark] = l1 > l2 ? [l1, l2] : [l2, l1];
    return (light + 0.05) / (dark + 0.05);
  };

  const getReadableForeground = (hsl: string) => {
    const bg = hslToRgbValues(hsl);
    const white: [number, number, number] = [255, 255, 255];
    const black: [number, number, number] = [0, 0, 0];
    const whiteRatio = contrastRatio(bg, white);
    const blackRatio = contrastRatio(bg, black);
    const useWhite = whiteRatio >= blackRatio;
    const ratio = useWhite ? whiteRatio : blackRatio;
    const grade = ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA Large' : 'Fail';
    return {
      color: useWhite ? '#FFFFFF' : '#000000',
      label: useWhite ? 'White' : 'Black',
      ratio: ratio.toFixed(2),
      grade,
      passes: ratio >= 4.5,
    };
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
    { name: 'Primary (Deep Teal)', var: '--primary', value: 'hsl(203.18 32.84% 26.27%)' },
    { name: 'Background (White)', var: '--background', value: 'hsl(0 0% 100%)' },
    { name: 'Foreground (Dark Blue-Gray)', var: '--foreground', value: 'hsl(210 45% 20%)' },
    { name: 'Secondary (Light Gray)', var: '--secondary', value: 'hsl(210 15% 92%)' },
    { name: 'Accent (Medium Blue)', var: '--accent', value: 'hsl(210 50% 40%)' },
    { name: 'Muted Foreground (Slate)', var: '--muted-foreground', value: 'hsl(215.38 16.32% 46.86%)' },
    { name: 'Border (Light Gray)', var: '--border', value: 'hsl(210 15% 88%)' },
    { name: 'Destructive (Soft Red)', var: '--destructive', value: 'hsl(0 100% 80%)' }
  ];

  const copyToClipboard = (colorVar: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedColor(colorVar);
    toast.success('Color copied to clipboard');
    setTimeout(() => setCopiedColor(''), 2000);
  };

  return (
    <>
      <section className="relative h-[200px] flex items-center justify-center overflow-hidden bg-gradient-to-r from-primary to-primary/80">
        <div className="relative z-10 text-center text-primary-foreground px-4">
          <Palette className="w-12 h-12 mx-auto mb-3" />
          <h1 className="font-display text-4xl md:text-5xl font-bold">Color Palette</h1>
          <p className="text-sm mt-2 opacity-90">Admin Only - Website Color System</p>
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex justify-end mb-4">
            <Button onClick={downloadPdf} disabled={downloading}>
              <Download className="w-4 h-4 mr-2" />
              {downloading ? 'Generating...' : 'Download as PDF'}
            </Button>
          </div>
          <div ref={printRef}>
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
                {colors.map((color) => {
                  const contrast = getReadableForeground(color.value);
                  return (
                  <Card 
                    key={color.var}
                    className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group"
                    onClick={() => copyToClipboard(color.var, color.value)}
                  >
                    <div 
                      className="h-28 w-full transition-transform group-hover:scale-105 flex items-center justify-between px-4"
                      style={{ background: color.value, color: contrast.color }}
                    >
                      <div>
                        <p className="text-base font-semibold leading-tight">Aa Sample</p>
                        <p className="text-xs opacity-90">on {contrast.label} text</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm font-bold">{contrast.ratio}:1</p>
                        <span
                          className="inline-block text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded"
                          style={{
                            background: contrast.passes ? 'rgba(34,197,94,0.9)' : 'rgba(239,68,68,0.9)',
                            color: '#fff',
                          }}
                        >
                          {contrast.grade}
                        </span>
                      </div>
                    </div>
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
                            <p className="text-xs text-muted-foreground pt-1 border-t mt-1">
                              <span className="font-semibold">Readable text:</span>{' '}
                              <span className="font-mono">{contrast.label}</span>{' '}
                              <span className="text-[10px]">({contrast.ratio}:1 · {contrast.grade})</span>
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
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Typography System</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                These are the font families used throughout the website.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="overflow-hidden">
                  <CardContent className="p-6">
                    <p className="text-sm font-semibold text-muted-foreground mb-2">Body Font</p>
                    <p className="text-3xl font-sans mb-4">Outfit</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Used for body text, paragraphs, and general content.
                    </p>
                    <p className="text-xs text-muted-foreground pt-2 border-t">
                      <span className="font-semibold">Tailwind class:</span> <code className="bg-muted px-2 py-1 rounded">font-sans</code>
                    </p>
                  </CardContent>
                </Card>

                <Card className="overflow-hidden">
                  <CardContent className="p-6">
                    <p className="text-sm font-semibold text-muted-foreground mb-2">Display Font</p>
                    <p className="text-3xl font-display mb-4">Montserrat</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Used for headings, titles, and emphasis.
                    </p>
                    <p className="text-xs text-muted-foreground pt-2 border-t">
                      <span className="font-semibold">Tailwind class:</span> <code className="bg-muted px-2 py-1 rounded">font-display</code>
                    </p>
                  </CardContent>
                </Card>
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
        </div>
      </section>
    </>
  );
};

export default ColorPalette;