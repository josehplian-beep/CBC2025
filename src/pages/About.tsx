import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Users, BookOpen, Target, MapPin, Clock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import communityImage from "@/assets/community.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };

const beliefs = [
  { icon: BookOpen, title: "The Bible", desc: "We believe the Bible is the inspired, inerrant Word of God and our ultimate authority." },
  { icon: Heart, title: "Salvation", desc: "We believe salvation is by grace through faith in Jesus Christ alone." },
  { icon: Users, title: "Community", desc: "We believe in the importance of Christian fellowship and community." },
  { icon: Target, title: "Mission", desc: "We believe in sharing the Gospel and making disciples of all nations." },
];

const stats = [
  { value: "2010", label: "Founded" },
];

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero */}
      <section className="relative h-[50vh] flex items-center justify-center overflow-hidden mt-20 bg-primary">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(210_55%_35%)_0%,_transparent_60%)] opacity-50" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_hsl(210_50%_30%)_0%,_transparent_60%)] opacity-40" />
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] as const }}
          className="relative z-10 text-center text-primary-foreground px-4 max-w-3xl"
        >
          <span className="text-sm font-semibold uppercase tracking-widest text-primary-foreground/60 mb-3 block">Our Church</span>
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">About CBC</h1>
          <p className="text-lg text-primary-foreground/80 max-w-xl mx-auto">
            Our Story, Beliefs, and Community
          </p>
        </motion.div>
      </section>


      {/* Our Story */}
      <section className="py-24 bg-background" id="our-story">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
            className="max-w-4xl mx-auto"
          >
            <motion.div variants={fadeUp} custom={0} className="text-center mb-12">
              <span className="text-sm font-semibold text-accent uppercase tracking-widest">Our History</span>
              <h2 className="font-display text-4xl font-bold mt-2 mb-4">Our Story</h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-12 items-start">
              <motion.div variants={fadeUp} custom={1} className="space-y-5 text-muted-foreground leading-relaxed">
                <p>
                  Chin Bethel Church began as a small group of faithful believers with a passion for worship, discipleship, and serving our local community. Over the years we have grown into a warm, multigenerational congregation committed to proclaiming the gospel, nurturing spiritual growth, and caring for one another.
                </p>
                <p>
                  Our roots trace back to families who met in homes for prayer and Bible study. From those humble beginnings we established regular worship services, children and youth ministries, and outreach programs to meet practical needs in the neighborhood.
                </p>
              </motion.div>

              <motion.div variants={fadeUp} custom={2} className="space-y-5 text-muted-foreground leading-relaxed">
                <p>
                  Today, CBC is a place where people from different backgrounds come together to worship, learn, and serve. We invest in discipleship through small groups and classes, support local missions, and partner with other organizations to bring hope and practical help to our city.
                </p>
                <Card className="bg-muted/40 border-border/50">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-center gap-3"><MapPin className="w-5 h-5 text-accent flex-shrink-0" /><span className="text-sm">6801 Douglas Legum Dr, Elkridge, MD 21075</span></div>
                    <div className="flex items-center gap-3"><Clock className="w-5 h-5 text-accent flex-shrink-0" /><span className="text-sm">Sundays 1:00 PM – 3:00 PM</span></div>
                    <div className="flex items-center gap-3"><Phone className="w-5 h-5 text-accent flex-shrink-0" /><span className="text-sm">(240) 316 8830</span></div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* What We Believe */}
      <section className="py-24 bg-muted/30 dark:bg-muted/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} custom={0} className="text-center mb-14">
              <span className="text-sm font-semibold text-accent uppercase tracking-widest">Our Faith</span>
              <h2 className="font-display text-4xl font-bold mt-2 mb-4">What We Believe</h2>
              <p className="text-muted-foreground max-w-lg mx-auto">Our faith is rooted in the unchanging truth of God's Word</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {beliefs.map(({ icon: Icon, title, desc }, i) => (
                <motion.div key={title} variants={fadeUp} custom={i + 1}>
                  <Card className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-border/50 bg-card/80 backdrop-blur-sm h-full">
                    <CardContent className="p-8 text-center">
                      <div className="bg-accent/10 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 group-hover:bg-accent/20 group-hover:scale-110 transition-all duration-300">
                        <Icon className="w-8 h-8 text-accent" />
                      </div>
                      <h3 className="font-display text-xl font-semibold mb-3 group-hover:text-primary transition-colors">{title}</h3>
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_hsl(210_55%_35%)_0%,_transparent_60%)] opacity-40" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="container mx-auto px-4 text-center relative z-10"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Come Visit Us</h2>
          <p className="text-primary-foreground/70 max-w-md mx-auto mb-8">
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
