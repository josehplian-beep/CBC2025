import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Footer from "@/components/Footer";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

          <div className="prose prose-lg max-w-none space-y-6 text-foreground/80">
            <p className="text-lg leading-relaxed">
              We value your privacy very highly. Please read this Privacy Policy carefully before using the Chin Bethel Church website (the "Website") operated by Chin Bethel Church, a(n) Nonprofit formed in Maryland, United States ("us, we, our") as this Privacy Policy contains important information regarding your privacy and how we may use the information we collect about you.
            </p>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">Information We Collect</h2>
              <p className="leading-relaxed">
                We want to be clear that our website does not request, record, or store any personal information from visitors. You're free to explore our pages without sharing details like your name, email address, or phone number.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">YouTube API Usage</h2>
              <p className="leading-relaxed">
                Our site features embedded YouTube videos, which rely on the YouTube API Services. When you view YouTube content on our website, YouTube may collect technical details about your visit—this can include your IP address, browser information, or device type. They may also place cookies or use tracking tools for personalization or analytics.
              </p>
              <p className="leading-relaxed mt-4">
                By interacting with the embedded videos, you agree to YouTube's Terms of Service:{" "}
                <a 
                  href="https://www.youtube.com/t/terms" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 underline"
                >
                  https://www.youtube.com/t/terms
                </a>
              </p>
              <p className="leading-relaxed mt-4">
                For details on how YouTube handles data, please see their Privacy Policy:{" "}
                <a 
                  href="https://policies.google.com/privacy" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 underline"
                >
                  https://policies.google.com/privacy
                </a>
              </p>
              <p className="leading-relaxed mt-4">
                We ourselves do not collect or store the information YouTube gathers.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">Cookies & Tracking Tools</h2>
              <p className="leading-relaxed">
                Our website may use cookies or similar technologies to help the site function smoothly and provide a better browsing experience. These small data files may store preferences or help us understand general usage patterns, but they do not personally identify you.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">Protecting Your Privacy</h2>
              <p className="leading-relaxed">
                Even though we do not actively collect personal information, we still maintain basic security and follow standard best practices to ensure your browsing experience remains safe.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">External Links</h2>
              <p className="leading-relaxed">
                You may find links on our website that take you to third-party sites. Please be aware that we do not control the privacy policies or content of those external pages. We encourage you to read their policies before interacting with them.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">Policy Updates</h2>
              <p className="leading-relaxed">
                We may revise or update this Privacy Policy at any time. Any changes will be posted on this page, and the updated version will be effective immediately upon publication.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 text-foreground">Contact Us</h2>
              <p className="leading-relaxed">
                If you have questions or need additional information about this Privacy Policy, you may contact us.
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
