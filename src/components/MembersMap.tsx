import { useEffect, useState, useMemo } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import Supercluster from 'supercluster';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Mail, Phone, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

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

type ClusterPoint = Supercluster.PointFeature<MemberLocation>;
type Cluster = Supercluster.ClusterFeature<MemberLocation>;
type ClusterOrPoint = ClusterPoint | Cluster;

interface MembersMapProps {
  members: Member[];
}

const mapContainerStyle = {
  width: '100%',
  height: '600px'
};

const defaultCenter = {
  lat: 39.0458,
  lng: -76.6413
};

export function MembersMap({ members }: MembersMapProps) {
  const [locations, setLocations] = useState<MemberLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<MemberLocation | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [bounds, setBounds] = useState<google.maps.LatLngBounds | null>(null);
  const [zoom, setZoom] = useState(10);
  const navigate = useNavigate();

  // Initialize supercluster
  const supercluster = useMemo(() => {
    const cluster = new Supercluster<MemberLocation>({
      radius: 60,
      maxZoom: 16,
    });

    if (locations.length > 0) {
      const points: ClusterPoint[] = locations.map(loc => ({
        type: 'Feature',
        properties: loc,
        geometry: {
          type: 'Point',
          coordinates: [loc.lng, loc.lat],
        },
      }));
      cluster.load(points);
    }

    return cluster;
  }, [locations]);

  // Get clusters for current map view
  const clusters = useMemo(() => {
    if (!bounds || locations.length === 0) return [];
    
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    
    return supercluster.getClusters(
      [sw.lng(), sw.lat(), ne.lng(), ne.lat()],
      Math.floor(zoom)
    );
  }, [supercluster, bounds, zoom, locations]);

  // Cache key prefix for localStorage
  const GEOCODE_CACHE_KEY = 'geocode_cache_';
  const CACHE_EXPIRY_DAYS = 30; // Cache expires after 30 days

  // Get cached geocode result
  const getCachedGeocode = (address: string): { lat: number; lng: number } | null => {
    try {
      const cached = localStorage.getItem(GEOCODE_CACHE_KEY + address);
      if (cached) {
        const { coords, timestamp } = JSON.parse(cached);
        const age = Date.now() - timestamp;
        const maxAge = CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
        
        if (age < maxAge) {
          return coords;
        }
        // Remove expired cache
        localStorage.removeItem(GEOCODE_CACHE_KEY + address);
      }
    } catch (err) {
      console.error('Cache read error:', err);
    }
    return null;
  };

  // Save geocode result to cache
  const setCachedGeocode = (address: string, coords: { lat: number; lng: number }) => {
    try {
      localStorage.setItem(
        GEOCODE_CACHE_KEY + address,
        JSON.stringify({ coords, timestamp: Date.now() })
      );
    } catch (err) {
      console.error('Cache write error:', err);
    }
  };

  // Geocode addresses using Nominatim (OpenStreetMap)
  const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
    // Check cache first
    const cached = getCachedGeocode(address);
    if (cached) {
      return cached;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'User-Agent': 'Church Management System'
          },
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const coords = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
        // Cache the result
        setCachedGeocode(address, coords);
        return coords;
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

      // Limit to first 50 members to avoid long loading times
      const limitedMembers = members.slice(0, 50);

      for (const member of limitedMembers) {
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
          // Add a small delay to respect rate limits (1 request per second)
          await new Promise(resolve => setTimeout(resolve, 1000));
          
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
      } else {
        // Calculate center based on all locations
        const avgLat = memberLocations.reduce((sum, loc) => sum + loc.lat, 0) / memberLocations.length;
        const avgLng = memberLocations.reduce((sum, loc) => sum + loc.lng, 0) / memberLocations.length;
        setMapCenter({ lat: avgLat, lng: avgLng });
      }

      setLocations(memberLocations);
      setIsLoading(false);
    };

    if (members.length > 0) {
      loadLocations();
    } else {
      setIsLoading(false);
    }
  }, [members]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="text-muted-foreground">Loading map data...</p>
            <p className="text-sm text-muted-foreground">
              Geocoding {locations.length} of {Math.min(members.length, 50)} addresses
            </p>
            <p className="text-xs text-muted-foreground italic">
              Note: Limited to 50 members due to API rate limits
            </p>
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

  return (
    <Card className="overflow-hidden">
      <div className="h-[600px] w-full">
        <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={zoom}
            onBoundsChanged={() => {
              const map = (window as any).map;
              if (map) {
                setBounds(map.getBounds());
                setZoom(map.getZoom());
              }
            }}
            onLoad={(map) => {
              (window as any).map = map;
              setBounds(map.getBounds()!);
              setZoom(map.getZoom()!);
            }}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
            }}
          >
            {clusters.map((cluster) => {
              const [lng, lat] = cluster.geometry.coordinates;
              const properties = cluster.properties;
              
              // Type guard for cluster
              const isCluster = 'cluster' in properties && properties.cluster === true;

              if (isCluster) {
                const count = properties.point_count || 0;
                const size = Math.min(40 + (count / locations.length) * 20, 60);

                return (
                  <Marker
                    key={`cluster-${cluster.id}`}
                    position={{ lat, lng }}
                    icon={{
                      url: `data:image/svg+xml;utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="%234f46e5" opacity="0.6"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="white" font-family="Arial" font-size="14" font-weight="bold">${count}</text></svg>`,
                      scaledSize: new google.maps.Size(size, size),
                    }}
                    onClick={() => {
                      const expansionZoom = Math.min(
                        supercluster.getClusterExpansionZoom(cluster.id as number),
                        16
                      );
                      setZoom(expansionZoom);
                      setMapCenter({ lat, lng });
                    }}
                  />
                );
              }

              const location = properties as MemberLocation;
              return (
                <Marker
                  key={`member-${location.member.id}`}
                  position={{ lat, lng }}
                  onClick={() => setSelectedMember(location)}
                />
              );
            })}

            {selectedMember && (
              <InfoWindow
                position={{ lat: selectedMember.lat, lng: selectedMember.lng }}
                onCloseClick={() => setSelectedMember(null)}
              >
                <div className="p-2 min-w-[250px]">
                  <div className="flex items-start gap-2 mb-3">
                    <User className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <h3 className="font-semibold text-base text-foreground">{selectedMember.member.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3 inline mr-1" />
                        {selectedMember.fullAddress}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-3 text-sm">
                    {selectedMember.member.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <a 
                          href={`mailto:${selectedMember.member.email}`}
                          className="text-primary hover:underline text-sm"
                        >
                          {selectedMember.member.email}
                        </a>
                      </div>
                    )}
                    {selectedMember.member.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <a 
                          href={`tel:${selectedMember.member.phone}`}
                          className="text-primary hover:underline text-sm"
                        >
                          {selectedMember.member.phone}
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={() => navigate(`/members/${selectedMember.member.id}`)}
                    className="w-full"
                  >
                    View Profile
                  </Button>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </LoadScript>
      </div>
      <CardContent className="p-4 bg-muted/50">
        <p className="text-sm text-muted-foreground">
          Showing {locations.length} member{locations.length !== 1 ? 's' : ''} on the map
        </p>
      </CardContent>
    </Card>
  );
}
