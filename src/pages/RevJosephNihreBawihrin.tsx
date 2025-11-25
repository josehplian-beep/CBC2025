import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import revJosephImage from "@/assets/Rev. Joseph Nihre.jpg";

const RevJosephNihreBawihrin = () => {
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
                  src={revJosephImage} 
                  alt="Rev. Joseph Nihre Bawihrin" 
                  className="w-full h-full object-cover object-[center_35%] scale-150"
                />
              </div>
            </div>
            
            <div>
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
                Rev. Joseph Nihre Bawihrin
              </h1>
              <p className="text-2xl text-primary font-semibold mb-6">
                Associate Pastor
              </p>
              
              <div className="space-y-3 mb-8">
                <a 
                  href="mailto:jnb@cbc.org" 
                  className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  <span>jnb@cbc.org</span>
                </a>
                <a 
                  href="tel:(555) 123-4568" 
                  className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Phone className="w-5 h-5" />
                  <span>(555) 123-4568</span>
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
              Rev. Joseph Nihre Bawihrin serves as the Associate Pastor of Chin Bethel Church, 
              bringing energy, passion, and a deep commitment to ministry. He joined CBC in [year] 
              and has been instrumental in [specific contributions].
            </p>
            
            <p>
              Originally from [location], Rev. Joseph received his theological education from 
              [institution], where he developed a strong foundation in biblical studies and 
              pastoral ministry. His calling to ministry began at an early age, influenced by 
              [background/influences].
            </p>
            
            <p>
              As Associate Pastor, Rev. Joseph oversees [specific ministries/responsibilities]. 
              He is particularly passionate about [specific areas of ministry] and has a gift 
              for connecting with people of all ages. His teaching style is engaging and 
              practical, making God's Word accessible and applicable to everyday life.
            </p>
            
            <p>
              Rev. Joseph is married to [spouse name] and they have [number] children. Outside 
              of ministry, he enjoys [hobbies/interests] and is actively involved in [community 
              activities].
            </p>
          </div>

          <div className="mt-12 pt-8 border-t">
            <h3 className="font-display text-2xl font-bold mb-4">Ministry Focus</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Youth and Young Adult Ministry</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Small Group Coordination</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Worship and Music Ministry</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Outreach and Evangelism</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RevJosephNihreBawihrin;
