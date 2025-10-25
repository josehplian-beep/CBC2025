import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Salvation = () => {
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
              <Heart className="w-12 h-12 text-primary" />
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Salvation</h1>
            <p className="text-xl text-muted-foreground">
              By Grace Through Faith in Jesus Christ
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="prose prose-lg max-w-none space-y-6 text-muted-foreground">
            <h2 className="font-display text-3xl font-bold text-foreground">Our Belief About Salvation</h2>
            
            <p>
              We believe salvation is by grace through faith in Jesus Christ alone. Salvation is a 
              free gift of God, received by faith, and not earned by works or human effort. It is 
              available to all who repent of their sins and trust in Christ as Lord and Savior.
            </p>
            
            <h3 className="font-display text-2xl font-bold text-foreground mt-8">The Need for Salvation</h3>
            <p>
              "For all have sinned and fall short of the glory of God" (Romans 3:23). Every person 
              is born with a sinful nature and is separated from God. Sin has broken our relationship 
              with our Creator and leads to spiritual death and eternal separation from God.
            </p>
            
            <h3 className="font-display text-2xl font-bold text-foreground mt-8">God's Provision</h3>
            <p>
              "For God so loved the world that he gave his one and only Son, that whoever believes 
              in him shall not perish but have eternal life" (John 3:16). God demonstrated His love 
              by sending Jesus Christ to die on the cross for our sins. Through His death and 
              resurrection, Jesus paid the penalty for sin and made salvation possible.
            </p>
            
            <h3 className="font-display text-2xl font-bold text-foreground mt-8">Receiving Salvation</h3>
            <p>
              "For it is by grace you have been saved, through faith—and this is not from yourselves, 
              it is the gift of God—not by works, so that no one can boast" (Ephesians 2:8-9). 
              Salvation is received by faith in Jesus Christ. We must repent of our sins, believe in 
              Jesus as Lord and Savior, and commit our lives to following Him.
            </p>
            
            <h3 className="font-display text-2xl font-bold text-foreground mt-8">Assurance and Security</h3>
            <p>
              We believe that those who are truly saved are eternally secure in Christ. "For I am 
              convinced that neither death nor life, neither angels nor demons, neither the present 
              nor the future, nor any powers, neither height nor depth, nor anything else in all 
              creation, will be able to separate us from the love of God that is in Christ Jesus our 
              Lord" (Romans 8:38-39).
            </p>
            
            <h3 className="font-display text-2xl font-bold text-foreground mt-8">New Life in Christ</h3>
            <p>
              Salvation brings transformation. "Therefore, if anyone is in Christ, the new creation 
              has come: The old has gone, the new is here!" (2 Corinthians 5:17). Those who are saved 
              are called to live in obedience to Christ, growing in faith and bearing fruit for God's 
              kingdom.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Salvation;
