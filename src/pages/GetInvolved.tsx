import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Droplets, HandHeart, Calendar, Heart, BookOpen } from "lucide-react";
import worshipImage from "@/assets/community.jpg";

const GetInvolved = () => {
  const opportunities = [
    {
      icon: Users,
      title: "Meet People",
      description: "Connect with our church family through small groups, life groups, and fellowship events.",
      action: "Find a Group",
    },
    {
      icon: Droplets,
      title: "Get Baptized",
      description: "Take the next step in your faith journey through believer's baptism.",
      action: "Learn About Baptism",
    },
    {
      icon: HandHeart,
      title: "Join Serving Team",
      description: "Use your gifts and talents to serve in various ministries and make a difference.",
      action: "Explore Opportunities",
    },
    {
      icon: Calendar,
      title: "Attend Events",
      description: "Participate in church events, outreach programs, and community activities.",
      action: "View Events",
    },
  ];

  const servingOpportunities = [
    { name: "Worship Team", description: "Lead our congregation in worship through music" },
    { name: "Children's Ministry", description: "Teach and care for our youngest members" },
    { name: "Youth Ministry", description: "Mentor and guide teenagers in their faith" },
    { name: "Hospitality Team", description: "Welcome guests and create a warm atmosphere" },
    { name: "Media & Tech", description: "Support services with audio, video, and streaming" },
    { name: "Prayer Team", description: "Intercede for our church and community needs" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-[500px] flex items-center justify-center overflow-hidden mt-20">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${worshipImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50" />
        </div>
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <Heart className="w-16 h-16 mx-auto mb-6" />
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">Get Involved</h1>
          <p className="text-xl md:text-2xl text-white/90">
            Find your place in our church family and make a difference
          </p>
        </div>
      </section>

      {/* Main Opportunities */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold mb-4">Ways to Connect</h2>
            <p className="text-muted-foreground text-lg">
              Discover meaningful ways to grow and serve
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {opportunities.map((opportunity, index) => {
              const Icon = opportunity.icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-all group">
                  <CardHeader>
                    <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="w-8 h-8" />
                    </div>
                    <CardTitle className="font-display text-xl">{opportunity.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{opportunity.description}</p>
                    <Button className="w-full">{opportunity.action}</Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Serving Opportunities */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold mb-4">Serving Opportunities</h2>
            <p className="text-muted-foreground text-lg">
              Use your gifts to serve others and glorify God
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {servingOpportunities.map((opportunity, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <h3 className="font-display text-xl font-semibold mb-2">{opportunity.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">{opportunity.description}</p>
                  <Button variant="outline" size="sm">
                    Get Involved
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Baptism Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <Droplets className="w-12 h-12 text-primary mb-4" />
                <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                  Ready to Get Baptized?
                </h2>
                <p className="text-muted-foreground mb-6">
                  Baptism is an important step of obedience that shows others we have personally 
                  trusted Jesus for our salvation. It's a public declaration of our faith and 
                  identification with Christ's death, burial, and resurrection.
                </p>
                <Button size="lg">
                  Sign Up for Baptism
                </Button>
              </div>
              <Card className="p-8 bg-primary text-primary-foreground">
                <h3 className="font-display text-2xl font-bold mb-4">What to Expect</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <BookOpen className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span>Baptism class to understand the significance</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Users className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span>Opportunity to share your testimony</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Heart className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <span>A celebration with your church family</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Questions About Getting Involved?
          </h2>
          <p className="text-primary-foreground/90 text-lg mb-8 max-w-2xl mx-auto">
            We're here to help you find your place in our church family. 
            Reach out to us and we'll be happy to guide you.
          </p>
          <Button size="lg" variant="secondary">
            Contact Us
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default GetInvolved;
