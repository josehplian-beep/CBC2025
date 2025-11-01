import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import StaffCard from "@/components/StaffCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import communityImage from "@/assets/community.jpg";

const Departments = () => {
  const [selectedDepartment, setSelectedDepartment] = useState("deacons");
  const [yearFilter, setYearFilter] = useState("current");

  const ministries = {
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-[400px] flex items-center justify-center overflow-hidden mt-20">
        <div className="absolute inset-0 bg-cover bg-center" style={{
          backgroundImage: `url(${communityImage})`
        }}>
          <div className="absolute inset-0 bg-neutral-900" />
        </div>
        <div className="relative z-10 text-center text-white px-4">
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-4">Departments</h1>
          <p className="text-xl md:text-2xl text-white/90">
            Meet the dedicated servants leading our church family
          </p>
        </div>
      </section>

      {/* Departments Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          {/* Year Filter */}
          <div className="max-w-md mx-auto mb-8">
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Year</SelectItem>
                <SelectItem value="2023-2025">2023-2025</SelectItem>
              </SelectContent>
            </Select>
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
              const filteredMembers = members;

              type DeptMember = {
                name: string;
                role: string;
                image?: string;
                email?: string;
                phone?: string;
                profileLink?: string;
              };

              return (
                <TabsContent key={key} value={key}>
                  {filteredMembers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {filteredMembers.map((member: DeptMember, index: number) => (
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
    </div>
  );
};

export default Departments;
