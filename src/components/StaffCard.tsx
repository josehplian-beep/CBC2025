import { Mail, Phone } from "lucide-react";
import { Card, CardContent } from "./ui/card";

interface StaffCardProps {
  name: string;
  role: string;
  image?: string;
  email?: string;
  phone?: string;
}

const StaffCard = ({ name, role, image, email, phone }: StaffCardProps) => {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 mb-4 overflow-hidden">
            {image ? (
              <img src={image} alt={name} className="w-full h-full object-cover object-[35%_35%] scale-150" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl font-display text-primary">
                {name.charAt(0)}
              </div>
            )}
          </div>
          <h3 className="font-display text-xl font-semibold mb-1 group-hover:text-primary transition-colors">
            {name}
          </h3>
          <p className="text-muted-foreground text-sm mb-4">{role}</p>
          {(email || phone) && (
            <div className="flex flex-col gap-2 text-sm text-muted-foreground w-full">
              {email && (
                <a href={`mailto:${email}`} className="flex items-center justify-center gap-2 hover:text-primary transition-colors">
                  <Mail className="w-4 h-4" />
                  <span className="text-xs">{email}</span>
                </a>
              )}
              {phone && (
                <a href={`tel:${phone}`} className="flex items-center justify-center gap-2 hover:text-primary transition-colors">
                  <Phone className="w-4 h-4" />
                  <span>{phone}</span>
                </a>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StaffCard;
