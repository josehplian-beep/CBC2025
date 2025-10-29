import { Mail, Phone, MapPin, Facebook, Instagram, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import cbcLogo from "@/assets/cbc-logo.png";
const Footer = () => {
  return <footer className="text-primary-foreground bg-gray-950">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* About Section */}
          <div>
            <div className="flex items-center mb-4">
              <img src={cbcLogo} alt="CBC Logo" className="h-12 w-auto" />
            </div>
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              Chin Bethel Church - A community of faith, worship, and service, dedicated to spreading God's love.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  CBC
                </Link>
              </li>
              <li>
                <Link to="/events" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Events
                </Link>
              </li>
              <li>
                <Link to="/media" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Media
                </Link>
              </li>
              <li>
                <Link to="/departments" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Departments
                </Link>
              </li>
              <li>
                <Link to="/get-involved" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  Get Involved
                </Link>
              </li>
            </ul>
          </div>

          {/* Service Times */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Service Times</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium">Saturday Service</p>
                <p className="text-primary-foreground/80">7:00 PM - 9:00 PM</p>
              </div>
              <div>
                <p className="font-medium">Sunday Service</p>
                <p className="text-primary-foreground/80">1:00 PM - 3:00 PM</p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="text-primary-foreground/80">
                  6801 Douglas Legum Dr<br />
                  Elkridge, MD 21075
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <span className="text-primary-foreground/80">(555) 123-4567</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <span className="text-primary-foreground/80">info@chinbethelchurch.com</span>
              </li>
            </ul>
            
            {/* Social Media */}
            <div className="flex gap-3 mt-6">
              <a href="#" className="bg-primary-foreground/10 hover:bg-primary-foreground/20 p-2 rounded-lg transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://www.instagram.com/cbcmino/" target="_blank" rel="noopener noreferrer" className="bg-primary-foreground/10 hover:bg-primary-foreground/20 p-2 rounded-lg transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="bg-primary-foreground/10 hover:bg-primary-foreground/20 p-2 rounded-lg transition-colors">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-12 pt-8 text-center text-sm text-primary-foreground/60">
          <p>&copy; {new Date().getFullYear()} Chin Bethel Church. All rights reserved.</p>
        </div>
      </div>
    </footer>;
};
export default Footer;