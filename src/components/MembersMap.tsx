import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import type { Map as LeafletMap } from 'leaflet';
import { Icon, LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Mail, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

// Fix for default marker icon in React-Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface Member {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  families?: {
    street_address: string;
    street_address_line2: string | null;
    city: string;
    county: string;
    state: string;
    postal_code: string;
  };
}

interface MemberLocation {
  member: Member;
  lat: number;
  lng: number;
  fullAddress: string;
}

// Component to fit bounds to all markers
function FitBounds({ locations }: { locations: MemberLocation[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (locations.length > 0) {
      const bounds = new LatLngBounds(
        locations.map(loc => [loc.lat, loc.lng] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [locations, map]);
  
  return null;
}

interface MembersMapProps {
  members: Member[];
}

export function MembersMap({ members }: MembersMapProps) {
  const [locations, setLocations] = useState<MemberLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Geocode addresses using Nominatim (OpenStreetMap)
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'User-Agent': 'Church Management System'
          }
        }
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
      return null;
    } catch (err) {
      console.error('Geocoding error:', err);
      return null;
    }
  };

  useEffect(() => {
    const loadLocations = async () => {
      setIsLoading(true);
      setError(null);
      const memberLocations: MemberLocation[] = [];

      for (const member of members) {
        let fullAddress = '';
        
        // Get address from family or member
        if (member.families) {
          fullAddress = `${member.families.street_address}, ${member.families.city}, ${member.families.state} ${member.families.postal_code}`;
        } else if (member.address) {
          const parts = member.address.split('|||').filter(p => p);
          if (parts.length >= 4) {
            fullAddress = `${parts[0]}, ${parts[2]}, ${parts[4]} ${parts[5]}`;
          }
        }

        if (fullAddress) {
          // Add a small delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 200));
          
          const coords = await geocodeAddress(fullAddress);
          if (coords) {
            memberLocations.push({
              member,
              lat: coords.lat,
              lng: coords.lng,
              fullAddress
            });
          }
        }
      }

      if (memberLocations.length === 0) {
        setError('No addresses could be geocoded. Please check that member addresses are complete.');
      }

      setLocations(memberLocations);
      setIsLoading(false);
    };

    loadLocations();
  }, [members]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="text-muted-foreground">Loading map data... This may take a moment.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || locations.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <MapPin className="w-12 h-12 text-muted-foreground" />
            <div>
              <p className="text-lg font-medium">No Locations Found</p>
              <p className="text-sm text-muted-foreground mt-2">
                {error || 'No members have valid addresses to display on the map.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const MapComponent = MapContainer as any;

  return (
    <Card className="overflow-hidden">
      <div className="h-[600px] w-full">
        <MapComponent
          center={[39.0458, -76.6413]}
          zoom={10}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds locations={locations} />
          {locations.map((location, index) => (
            <Marker
              key={`${location.member.id}-${index}`}
              position={[location.lat, location.lng]}
            >
              <Popup>
                <div className="p-2">
                  <div className="flex items-start gap-2 mb-3">
                    <User className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <h3 className="font-semibold text-base">{location.member.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3 inline mr-1" />
                        {location.fullAddress}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-3 text-sm">
                    {location.member.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <a 
                          href={`mailto:${location.member.email}`}
                          className="text-primary hover:underline text-sm"
                        >
                          {location.member.email}
                        </a>
                      </div>
                    )}
                    {location.member.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <a 
                          href={`tel:${location.member.phone}`}
                          className="text-primary hover:underline text-sm"
                        >
                          {location.member.phone}
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={() => navigate(`/members/${location.member.id}`)}
                    className="w-full"
                  >
                    View Profile
                  </Button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapComponent>
      </div>
      <CardContent className="p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground">
          Showing {locations.length} member{locations.length !== 1 ? 's' : ''} on the map
        </p>
      </CardContent>
    </Card>
  );
}
