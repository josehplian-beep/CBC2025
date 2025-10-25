import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Mission = () => {
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
              <Target className="w-12 h-12 text-primary" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Mission</h1>
            <p className="text-xl text-muted-foreground">
              Making Disciples of All Nations
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
            <h2 className="font-display text-3xl font-bold text-foreground">Our Mission</h2>
            
            <p>
              We believe in sharing the Gospel and making disciples of all nations. The Great 
              Commission given by Jesus Christ is not optional—it is the primary mission of the 
              church. We are called to go, make disciples, baptize, and teach, empowered by the 
              Holy Spirit.
            </p>
            
            <h3 className="font-display text-2xl font-bold text-foreground mt-8">The Great Commission</h3>
            <p>
              "Therefore go and make disciples of all nations, baptizing them in the name of the 
              Father and of the Son and of the Holy Spirit, and teaching them to obey everything I 
              have commanded you. And surely I am with you always, to the very end of the age" 
              (Matthew 28:19-20). This command from Jesus is the foundation of our mission.
            </p>
            
            <h3 className="font-display text-2xl font-bold text-foreground mt-8">Evangelism</h3>
            <p>
              We are committed to sharing the good news of Jesus Christ with those who do not know 
              Him. "How, then, can they call on the one they have not believed in? And how can they 
              believe in the one of whom they have not heard? And how can they hear without someone 
              preaching to them?" (Romans 10:14). Every believer is called to be a witness for Christ.
            </p>
            
            <h3 className="font-display text-2xl font-bold text-foreground mt-8">Discipleship</h3>
            <p>
              Making disciples involves more than just evangelism—it includes teaching believers to 
              obey Christ's commands and grow in spiritual maturity. We are committed to helping 
              believers grow in their faith through Bible study, mentorship, and practical ministry 
              experience.
            </p>
            
            <h3 className="font-display text-2xl font-bold text-foreground mt-8">Local and Global Outreach</h3>
            <p>
              Our mission field begins in our local community but extends to the ends of the earth. 
              We support missionaries, engage in community outreach, and partner with other churches 
              and organizations to spread the Gospel globally. "But you will receive power when the 
              Holy Spirit comes on you; and you will be my witnesses in Jerusalem, and in all Judea 
              and Samaria, and to the ends of the earth" (Acts 1:8).
            </p>
            
            <h3 className="font-display text-2xl font-bold text-foreground mt-8">Our Commitment</h3>
            <p>
              At Chin Bethel Church, missions is not just a program—it's our identity. We are 
              committed to training, equipping, and sending believers to fulfill the Great Commission. 
              Through prayer, giving, and active participation, we support mission work both locally 
              and around the world.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Mission;
