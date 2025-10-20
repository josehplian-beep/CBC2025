import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import StaffCard from "@/components/StaffCard";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Heart, Users, BookOpen, Target, Search } from "lucide-react";
import communityImage from "@/assets/community.jpg";
import revJosephImage from "@/assets/rev-joseph.jpg";
import revVanDuhCeuImage from "@/assets/rev-van-duh-ceu.jpg";
const About = () => {
  const [selectedDepartment, setSelectedDepartment] = useState("pastors");
  const [searchQuery, setSearchQuery] = useState("");

  const ministries = {
    pastors: [{
      name: "Rev. Van Duh Ceu",
      role: "Senior Pastor",
      email: "vdc@cbc.org",
      phone: "(555) 123-4567",
      image: revVanDuhCeuImage,
      profileLink: "/staff/rev-van-duh-ceu"
    }, {
      name: "Rev. Joseph Nihre Bawihrin",
      role: "Associate Pastor",
      email: "jnb@cbc.org",
      phone: "(555) 123-4568",
      image: revJosephImage,
      profileLink: "/staff/rev-joseph-nihre-bawihrin"
    }],
    leadership: Array(12).fill(null).map((_, i) => ({
      name: `Leadership Member ${i + 1}`,
      role: "Church Leader",
      email: `leader${i + 1}@cbc.org`
    })),
    deacons: [
      {
        name: "Upa Biak Hmung",
        role: "Chairman"
      },
      {
        name: "Upa Thang Er",
        role: "Vice Chairman"
      },
      {
        name: "Upa Cung Biak Thawng",
        role: "Secretary"
      },
      {
        name: "Upa Ngunzacung",
        role: "Assistant Secretary"
      },
      {
        name: "Upa Dawt Hlei Sang",
        role: "Treasurer"
      },
      {
        name: "Upa Biak Hlun",
        role: "Assistant Treasurer"
      },
      {
        name: "Upa Rung Cin",
        role: "Member"
      },
      {
        name: "Upa Zang Kung",
        role: "Member"
      },
      {
        name: "Upa Cung Van Hmung",
        role: "Member"
      },
      {
        name: "Upa Tial Thluam",
        role: "Member"
      }
    ],
    women: [
      {
        name: "Pi Sui Men",
        role: "President"
      },
      {
        name: "Pi Zai Hlei Par",
        role: "Vice President"
      },
      {
        name: "Pi Lalremruati",
        role: "Secretary"
      },
      {
        name: "Pi Siang Hnem Par",
        role: "Assistant Secretary"
      },
      {
        name: "Pi Ruth Dawt Hlei",
        role: "Treasurer"
      },
      {
        name: "Pi Hniang Hlei Par",
        role: "Assistant Treasurer"
      },
      {
        name: "Pi Sui Par",
        role: "Member"
      },
      {
        name: "Pi Hniang Sui Tial",
        role: "Member"
      },
      {
        name: "Pi Tin Hnem",
        role: "Member"
      },
      {
        name: "Pi Hniang Zi Tial",
        role: "Member"
      },
      {
        name: "Pi Ngun Tlem",
        role: "Member"
      },
      {
        name: "Pi Thin Hnem",
        role: "Member"
      }
    ],
    youth: [
      {
        name: "Val. Tluang Lian",
        role: "President"
      },
      {
        name: "Pu Bawi Za Ceu Lian",
        role: "Vice President"
      },
      {
        name: "Val. Bawi Min Sang",
        role: "Secretary"
      },
      {
        name: "Lg. Jairus Biak Tha Cin Par",
        role: "Assistant Secretary"
      },
      {
        name: "Lg. Bawi Chin Tial",
        role: "Treasurer"
      },
      {
        name: "Pi Nawmi Zinghlawng",
        role: "Assistant Treasurer"
      },
      {
        name: "Val. Bawi Lian Thawng",
        role: "Member"
      },
      {
        name: "Val. Za Hnin Thang",
        role: "Member"
      },
      {
        name: "Lg. Linda Sui Pen",
        role: "Member"
      },
      {
        name: "Lg. Zing Chin Par",
        role: "Member"
      },
      {
        name: "Pu Tha Lian Sang",
        role: "Member"
      },
      {
        name: "Pu Henry Khang Za Tin",
        role: "Member"
      }
    ],
    children: [
      {
        name: "Sayamah Sung Caan Tial",
        role: "President (Pre-K)"
      },
      {
        name: "Lg. Sui Bor Iang",
        role: "Vice President"
      },
      {
        name: "Val. Sang Awr",
        role: "Secretary (Pre-K)"
      },
      {
        name: "Lg. Jairus Biak Tha Chin Par",
        role: "Assistant Secretary (Seniors)"
      },
      {
        name: "Lg. Mang Hlawn Tial",
        role: "Treasurer"
      },
      {
        name: "Lg. Sui Len Par",
        role: "Assistant Treasurer"
      },
      {
        name: "Lg. Bawi Chin Tial",
        role: "Teacher"
      },
      {
        name: "Pi Biak Par Iang Bawihrin",
        role: "Teacher (Intermediate)"
      },
      {
        name: "Pi Rachel Sui Chin Par",
        role: "Teacher (Intermediate)"
      },
      {
        name: "Pu Bawi Za Ceu Lian",
        role: "Teacher (Junior)"
      },
      {
        name: "Pi Par Tin Tial",
        role: "Teacher (Junior)"
      },
      {
        name: "Val. Bawi Lian Thawng",
        role: "Teacher (Senior)"
      }
    ],
    mission: [
      {
        name: "Rev. Van Duh Ceu",
        role: "Director"
      },
      {
        name: "Rev. Joseph Nihre Bawihrin",
        role: "Member"
      },
      {
        name: "Pi Mang Hniang Sung",
        role: "Treasurer"
      },
      {
        name: "Pi May Iang Sung",
        role: "Secretary"
      },
      {
        name: "Pu Peng Hu",
        role: "Member"
      },
      {
        name: "Pi Van Tha Hlei Par",
        role: "Member"
      },
      {
        name: "Pi Hlei Sung",
        role: "Member"
      },
      {
        name: "Pi Sarah Thang",
        role: "Member"
      },
      {
        name: "Pu Siang Kung Thang",
        role: "Member"
      }
    ],
    building: [
      {
        name: "Pu Maung Maung Lian Dawt",
        role: "Chairman"
      },
      {
        name: "Pu Khamh Cung",
        role: "Secretary"
      },
      {
        name: "Pu Kyi Soe",
        role: "Treasurer"
      },
      {
        name: "Pu Lai Ram Thang",
        role: "Member"
      },
      {
        name: "Pu Lian Za Thang",
        role: "Member"
      },
      {
        name: "Pu Sui Thawng",
        role: "Member"
      },
      {
        name: "Pu Bawi Za Lian",
        role: "Member"
      },
      {
        name: "Pu Cung Lian Hup",
        role: "Member"
      },
      {
        name: "Pu Sang Ceu",
        role: "Member"
      },
      {
        name: "Pu Thawng Hmung",
        role: "Member"
      },
      {
        name: "Val. Thla Hnin",
        role: "Member"
      },
      {
        name: "Val. Siang Hnin Lian",
        role: "Member"
      }
    ],
    culture: [
      {
        name: "Pu Van Tha Thawng",
        role: "President"
      },
      {
        name: "Pu Lung Kung",
        role: "Member"
      },
      {
        name: "Lg. Sui Len Par",
        role: "Member"
      },
      {
        name: "Val. Bawi Lian Thawng",
        role: "Member"
      },
      {
        name: "Pi Rachel Sui Chin Par",
        role: "Member"
      }
    ],
    media: [
      {
        name: "Casey Tluangi",
        role: "Admin"
      },
      {
        name: "Lg. Dawt Chin Tial",
        role: "Member (PowerPoint)"
      },
      {
        name: "Lg. Ram Za Len",
        role: "Member (Photographer)"
      },
      {
        name: "Nu Jessica Lian",
        role: "Member (PowerPoint)"
      },
      {
        name: "Pa Bawi Pek Lian",
        role: "Member (Live)"
      },
      {
        name: "Tv. Za Hning Thang",
        role: "Member (Live)"
      }
    ],
    auditors: [
      {
        name: "Pu Henry Tin",
        role: "Auditor"
      },
      {
        name: "Pu Lung Kung",
        role: "Auditor"
      }
    ]
  };
  return <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-[400px] flex items-center justify-center overflow-hidden mt-20">
        <div className="absolute inset-0 bg-cover bg-center" style={{
        backgroundImage: `url(${communityImage})`
      }}>
          <div className="absolute inset-0 bg-neutral-900" />
        </div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">About CBC</h1>
          <p className="text-xl md:text-2xl text-white/90">
            Our Story, Beliefs, and Community
          </p>
        </div>
      </section>

      {/* What We Believe */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold mb-4">What We Believe</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Our faith is rooted in the unchanging truth of God's Word
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">The Bible</h3>
                <p className="text-muted-foreground text-sm">
                  We believe the Bible is the inspired, inerrant Word of God and our ultimate authority.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">Salvation</h3>
                <p className="text-muted-foreground text-sm">
                  We believe salvation is by grace through faith in Jesus Christ alone.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">Community</h3>
                <p className="text-muted-foreground text-sm">
                  We believe in the importance of Christian fellowship and community.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-3">Mission</h3>
                <p className="text-muted-foreground text-sm">
                  We believe in sharing the Gospel and making disciples of all nations.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Pastors */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold mb-4">Our Pastors</h2>
            <p className="text-muted-foreground text-lg">
              Meet our spiritual leaders
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {ministries.pastors.map((member, index) => (
              <StaffCard key={index} {...member} />
            ))}
          </div>
        </div>
      </section>

      {/* Our Staff */}
      <section className="py-20 bg-secondary" id="staff">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold mb-4">Our Staff</h2>
            <p className="text-muted-foreground text-lg">
              Meet the dedicated servants leading our church family
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-md mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Ministry Tabs */}
          <Tabs defaultValue="deacons" className="w-full" onValueChange={setSelectedDepartment}>
            <TabsList className="grid w-full max-w-4xl mx-auto grid-cols-5 lg:grid-cols-9 mb-8">
              <TabsTrigger value="deacons">Deacons</TabsTrigger>
              <TabsTrigger value="women">Women</TabsTrigger>
              <TabsTrigger value="youth">Youth</TabsTrigger>
              <TabsTrigger value="children">Children</TabsTrigger>
              <TabsTrigger value="mission">Mission</TabsTrigger>
              <TabsTrigger value="building">Building</TabsTrigger>
              <TabsTrigger value="culture">Culture</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="auditors">Auditors</TabsTrigger>
            </TabsList>

            {Object.entries(ministries).map(([key, members]) => {
              if (key === 'leadership' || key === 'pastors') return null;
              const filteredMembers = members.filter((member: any) =>
                member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                member.role.toLowerCase().includes(searchQuery.toLowerCase())
              );

              return (
                <TabsContent key={key} value={key}>
                  {filteredMembers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {filteredMembers.map((member: any, index: number) => (
                        <StaffCard key={index} {...member} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No staff found</p>
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </section>

      <Footer />
    </div>;
};
export default About;