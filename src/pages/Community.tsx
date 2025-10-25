import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Community = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <section className="relative pt-32 pb-16 bg-secondary">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/about")}
            className="mb-6"
          >
            ← Back to About
          </Button>
          
          <div className="text-center mb-12">
            <div className="bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-12 h-12 text-primary" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Community</h1>
            <p className="text-xl text-muted-foreground">
              The Importance of Christian Fellowship
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
            <h2 className="font-display text-3xl font-bold text-foreground">Our Belief About Community</h2>
            
            <p>
              We believe in the importance of Christian fellowship and community. The church is not 
              just a building or an organization, but a living body of believers united in Christ. 
              We are called to love one another, serve one another, and grow together in faith.
            </p>
            
            <h3 className="font-display text-2xl font-bold text-foreground mt-8">The Body of Christ</h3>
            <p>
              "Just as a body, though one, has many parts, but all its many parts form one body, 
              so it is with Christ" (1 Corinthians 12:12). The church is the body of Christ, and 
              each believer is a vital member. We need each other, and God has gifted each person 
              uniquely to contribute to the health and growth of the body.
            </p>
            
            <h3 className="font-display text-2xl font-bold text-foreground mt-8">Fellowship and Unity</h3>
            <p>
              "They devoted themselves to the apostles' teaching and to fellowship, to the breaking 
              of bread and to prayer" (Acts 2:42). True Christian fellowship goes beyond casual 
              acquaintance. It involves sharing life together, supporting one another through 
              difficulties, celebrating victories, and spurring each other on toward love and good deeds.
            </p>
            
            <h3 className="font-display text-2xl font-bold text-foreground mt-8">Loving One Another</h3>
            <p>
              "A new command I give you: Love one another. As I have loved you, so you must love one 
              another. By this everyone will know that you are my disciples, if you love one another" 
              (John 13:34-35). Love is the defining characteristic of Christian community. We are 
              called to love sacrificially, forgive freely, and serve humbly.
            </p>
            
            <h3 className="font-display text-2xl font-bold text-foreground mt-8">Encouraging One Another</h3>
            <p>
              "And let us consider how we may spur one another on toward love and good deeds, not 
              giving up meeting together, as some are in the habit of doing, but encouraging one 
              another—and all the more as you see the Day approaching" (Hebrews 10:24-25). We 
              believe in the power of encouragement and the importance of regular fellowship.
            </p>
            
            <h3 className="font-display text-2xl font-bold text-foreground mt-8">Our Practice</h3>
            <p>
              At Chin Bethel Church, we foster community through worship services, small groups, 
              ministry teams, and fellowship events. We believe that every member has a place and a 
              purpose in our church family. We welcome you to join us and experience the blessing of 
              Christian community.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Community;
