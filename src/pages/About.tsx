import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Users, BookOpen, Target, MapPin, Clock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as const }
  })
};

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

const beliefs = [
  { icon: BookOpen, title: "The Bible", desc: "We believe the Bible is the inspired, inerrant Word of God and our ultimate authority." },
  { icon: Heart, title: "Salvation", desc: "We believe salvation is by grace through faith in Jesus Christ alone." },
  { icon: Users, title: "Community", desc: "We believe in the importance of Christian fellowship and community." },
  { icon: Target, title: "Mission", desc: "We believe in sharing the Gospel and making disciples of all nations." },
];

// Render **bold** markdown in text
const renderBoldText = (text: string) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="text-foreground">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};

const About = () => {
  const { data: storyContent } = useQuery({
    queryKey: ["page-content", "about", "our_story"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_content")
        .select("content")
        .eq("page_key", "about")
        .eq("section_key", "our_story")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data?.content as string | null;
    },
  });

  const paragraphs = storyContent
    ? storyContent.split(/\n\n+/).filter((p) => p.trim())
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero */}
      <section className="relative mt-20 overflow-hidden bg-primary">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_hsl(210_55%_35%/0.6)_0%,_transparent_70%)]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
          className="relative z-10 container mx-auto px-8 md:px-16 py-16 md:py-20 max-w-4xl"
        >
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/50 mb-4 block" />
          <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-4 leading-[1.1]">
            CBC TUANBIA
          </h1>
        </motion.div>
      </section>

      {/* Our Story */}
      <section className="py-12 md:py-16 bg-background" id="our-story">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-5xl mx-auto">
            <div className="max-w-2xl mx-auto space-y-5">
              <motion.div variants={fadeUp} custom={0} className="text-center mb-2">
                <span className="text-xs font-semibold text-accent uppercase tracking-[0.2em]">Our Story</span>
                <h2 className="font-display text-3xl md:text-4xl font-bold mt-3">Magnify</h2>
              </motion.div>
              <motion.div variants={fadeUp} custom={1} className="text-muted-foreground text-base leading-relaxed space-y-4">
                {paragraphs.map((p, i) => (
                  <p key={i}>{renderBoldText(p.trim())}</p>
                ))}
              </motion.div>

              <motion.div variants={fadeUp} custom={1} className="flex flex-wrap justify-center gap-6 pt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-accent" />
                  <span>6801 Douglas Legum Dr, Elkridge, MD 21075</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-accent" />
                  <span>Sundays 1:00 – 3:00 PM</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-accent" />
                  <span>(240) 316 8830</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What We Believe */}
      <section className="py-12 md:py-16 bg-muted/20 dark:bg-muted/10 relative">
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div variants={fadeUp} custom={0} className="text-center mb-10">
              <span className="text-xs font-semibold text-accent uppercase tracking-[0.2em]">Our Faith</span>
              <h2 className="font-display text-3xl md:text-4xl font-bold mt-3 mb-4">What We Believe</h2>
              <p className="text-muted-foreground max-w-md mx-auto text-sm">
                Our faith is rooted in the unchanging truth of God's Word
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
              {beliefs.map(({ icon: Icon, title, desc }, i) => (
                <motion.div key={title} variants={fadeUp} custom={i + 1}>
                  <Card className="group border-border/30 bg-card/60 backdrop-blur-sm hover:bg-card hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 h-full">
                    <CardContent className="p-7">
                      <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center mb-5 group-hover:bg-accent/20 transition-colors duration-300">
                        <Icon className="w-5 h-5 text-accent" />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 md:py-16 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,_hsl(210_55%_35%/0.5)_0%,_transparent_60%)]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="container mx-auto px-4 text-center relative z-10"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Come Visit Us</h2>
          <p className="text-primary-foreground/60 max-w-md mx-auto mb-8">
            We'd love to meet you. Join us for worship, a small group, or one of our community events.
          </p>
          <Link to="/get-involved">
            <Button size="lg" variant="secondary" className="font-semibold">
              Get Involved
            </Button>
          </Link>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
