import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import revVanDuhCeuImage from "@/assets/Rev. Van Duh Ceu.jpg";

const RevVanDuhCeu = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 bg-secondary">
        <div className="container mx-auto px-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/about")}
            className="mb-6"
          >
            ← Back to Staff
          </Button>
          
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div className="flex justify-center">
              <div className="w-80 h-80 rounded-full overflow-hidden shadow-2xl">
                <img 
                  src={revVanDuhCeuImage} 
                  alt="Rev. Van Duh Ceu" 
                  className="w-full h-full object-cover object-[center_35%] scale-150"
                />
              </div>
            </div>
            
            <div>
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
                Rev. Van Duh Ceu
              </h1>
              <p className="text-2xl text-primary font-semibold mb-6">
                Senior Pastor
              </p>
              
              <div className="space-y-3 mb-8">
                <a 
                  href="mailto:vdc@cbc.org" 
                  className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  <span>vdc@cbc.org</span>
                </a>
                <a 
                  href="tel:(555) 123-4567" 
                  className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  <span>(555) 123-4567</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Biography Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="font-display text-3xl font-bold mb-8">Biography</h2>
          
          <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
            <p>
              Rev. Van Duh Ceu has been serving as the Senior Pastor of Chin Bethel Church 
              since [year]. With a heart for ministry and a passion for serving the community, 
              he has led our congregation with wisdom and compassion.
            </p>
            
            <p>
              Born and raised in [location], Rev. Van Duh Ceu received his theological training 
              at [institution]. His ministry experience spans over [number] years, during which 
              he has served in various capacities including [previous roles].
            </p>
            
            <p>
              Under his leadership, CBC has grown both spiritually and numerically. He is known 
              for his powerful preaching, pastoral care, and commitment to discipleship. His 
              vision for the church centers on building a strong community of believers who are 
              equipped to serve God and share the Gospel.
            </p>
            
            <p>
              Rev. Van Duh Ceu is married to [spouse name] and they have [number] children. 
              When not serving the church, he enjoys [hobbies/interests].
            </p>
          </div>

          <div className="mt-12 pt-8 border-t">
            <h3 className="font-display text-2xl font-bold mb-4">Ministry Focus</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Preaching and Teaching the Word of God</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Pastoral Care and Counseling</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Church Leadership and Vision Casting</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Community Outreach and Evangelism</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RevVanDuhCeu;
