import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const TheBible = () => {
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
              <BookOpen className="w-12 h-12 text-primary" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">The Bible</h1>
            <p className="text-xl text-muted-foreground">
              God's Inspired and Inerrant Word
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
            <h2 className="font-display text-3xl font-bold text-foreground">Our Belief About Scripture</h2>
            
            <p>
              We believe the Bible is the inspired, inerrant Word of God and our ultimate authority 
              for faith and practice. The Scriptures, both Old and New Testaments, were given by divine 
              inspiration and are completely trustworthy in all matters of doctrine and practice.
            </p>
            
            <h3 className="font-display text-2xl font-bold text-foreground mt-8">Divine Inspiration</h3>
            <p>
              "All Scripture is God-breathed and is useful for teaching, rebuking, correcting and 
              training in righteousness" (2 Timothy 3:16). We believe that God superintended the 
              human authors of Scripture so that they composed and recorded without error His message 
              to mankind in the words of their original writings.
            </p>
            
            <h3 className="font-display text-2xl font-bold text-foreground mt-8">Ultimate Authority</h3>
            <p>
              The Bible is our final authority in all matters of faith, doctrine, and Christian living. 
              It is the standard by which all teaching and experience must be measured. No human authority, 
              tradition, or experience can supersede the authority of God's Word.
            </p>
            
            <h3 className="font-display text-2xl font-bold text-foreground mt-8">Sufficient for Life</h3>
            <p>
              The Scriptures contain everything necessary for salvation and godly living. Through the 
              Bible, God has revealed His plan of redemption, His character, and His will for our lives. 
              The Word of God is living and active, sharper than any double-edged sword (Hebrews 4:12).
            </p>
            
            <h3 className="font-display text-2xl font-bold text-foreground mt-8">Our Practice</h3>
            <p>
              At Chin Bethel Church, we are committed to biblical preaching and teaching. We believe 
              in studying the Scriptures carefully, applying them faithfully, and allowing them to 
              transform our lives. We encourage every member to read, study, and meditate on God's 
              Word daily.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TheBible;
