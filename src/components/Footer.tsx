import { Mail, Phone, MapPin, Facebook, Instagram, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import cbcLogo from "@/assets/cbc-logo.png";
import { SOCIAL } from "@/config/social";

const quickLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "CBC" },
  { to: "/events", label: "Events" },
  { to: "/media", label: "Media" },
  { to: "/departments", label: "Departments" },
  { to: "/get-involved", label: "Get Involved" },
  { to: "/privacy-policy", label: "Privacy Policy" },
];

const serviceTimes = [
  { day: "Sunday", time: "1:00 PM - 3:00 PM" },
  { day: "Wednesday", time: "7:00 PM - 9:00 PM" },
  { day: "Saturday", time: "7:00 PM - 9:00 PM" },
];

const Footer = () => (
  <footer className="text-primary-foreground bg-gray-950">
    <div className="container mx-auto px-4 py-16">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
        {/* About */}
        <div>
          <img src={cbcLogo} alt="CBC Logo" className="h-12 w-auto mb-4" />
          <p className="text-primary-foreground/80 text-sm leading-relaxed">
            Chin Bethel Church - A community of faith, worship, and service, dedicated to spreading God's love.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            {quickLinks.map(({ to, label }) => (
              <li key={to}>
                <Link to={to} className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Service Times */}
        <div>
          <h3 className="font-semibold text-lg mb-4">Service Times</h3>
          <div className="space-y-3 text-sm">
            {serviceTimes.map(({ day, time }) => (
              <div key={day}>
                <p className="font-medium">{day} Service</p>
                <p className="text-primary-foreground/80">{time}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div>
          <h3 className="font-semibold text-lg mb-4">Contact Us</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span className="text-primary-foreground/80">6801 Douglas Legum Dr<br />Elkridge, MD 21075</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <span className="text-primary-foreground/80">(240) 316 8830</span>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="w-4 h-4 flex-shrink-0" />
              <span className="text-primary-foreground/80">Admin@chinbethelchurch.com</span>
            </li>
          </ul>

          <div className="flex gap-3 mt-6">
            {[
              { href: SOCIAL.facebook, icon: Facebook, label: "Facebook" },
              { href: SOCIAL.instagram, icon: Instagram, label: "Instagram" },
              { href: SOCIAL.youtube, icon: Youtube, label: "YouTube" },
            ].map(({ href, icon: Icon, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="bg-primary-foreground/10 hover:bg-primary-foreground/20 p-2 rounded-lg transition-colors"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-primary-foreground/20 mt-12 pt-8 text-center text-sm text-primary-foreground/60">
        <p>&copy; {new Date().getFullYear()} Chin Bethel Church. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
