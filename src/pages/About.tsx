import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Users, BookOpen, Target, MapPin, Clock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import communityImage from "@/assets/community.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };

const beliefs = [
  { icon: BookOpen, title: "The Bible", desc: "We believe the Bible is the inspired, inerrant Word of God and our ultimate authority." },
  { icon: Heart, title: "Salvation", desc: "We believe salvation is by grace through faith in Jesus Christ alone." },
  { icon: Users, title: "Community", desc: "We believe in the importance of Christian fellowship and community." },
  { icon: Target, title: "Mission", desc: "We believe in sharing the Gospel and making disciples of all nations." },
];

const About = () => (
  <div className="min-h-screen bg-background">
    <Navigation />

    {/* Hero — split layout with image */}
    <section className="relative mt-20 overflow-hidden">
      <div className="grid lg:grid-cols-2 min-h-[60vh]">
        {/* Text side */}
        <div className="flex items-center bg-primary relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_hsl(210_55%_35%/0.6)_0%,_transparent_70%)]" />
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }}
            className="relative z-10 px-8 md:px-16 lg:px-20 py-16 max-w-xl"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/50 mb-4 block">
              Our Church
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-5 leading-[1.1]">
              About CBC
            </h1>
            <p className="text-primary-foreground/70 text-lg leading-relaxed">
              Our Story, Beliefs, and Community
            </p>
          </motion.div>
        </div>

        {/* Image side */}
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }}
          className="relative min-h-[300px] lg:min-h-0"
        >
          <img
            src={communityImage}
            alt="CBC community gathering"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent lg:block hidden" />
        </motion.div>
      </div>
    </section>

    {/* Our Story — centered editorial */}
    <section className="py-20 md:py-28 bg-background" id="our-story">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden" animate="visible"
          variants={stagger}
          className="max-w-5xl mx-auto"
        >
          <motion.div variants={fadeUp} custom={0} className="text-center mb-14">
            <span className="text-xs font-semibold text-accent uppercase tracking-[0.2em]">Our History</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mt-3">Our Story</h2>
          </motion.div>

          <div className="max-w-2xl mx-auto text-center space-y-8">
            <motion.p variants={fadeUp} custom={1} className="text-muted-foreground text-lg leading-relaxed">
              Kannih Chin Bethel Church (CBC) nih zumtu khrihfa kan sinak humhimter awk le Pathian ramkauhternak dingah hi khrihfabu cu March 21, 2010, ni ah dirh a si.
            </motion.p>

            <motion.div variants={fadeUp} custom={3} className="flex flex-wrap justify-center gap-6 pt-4 text-sm text-muted-foreground">
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

    {/* What We Believe — minimal grid */}
    <section className="py-20 md:py-28 bg-muted/20 dark:bg-muted/10 relative">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden" animate="visible"
          variants={stagger}
        >
          <motion.div variants={fadeUp} custom={0} className="text-center mb-16">
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
    <section className="py-20 bg-primary text-primary-foreground relative overflow-hidden">
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

export default About;
