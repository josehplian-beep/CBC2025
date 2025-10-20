import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import StaffCard from "@/components/StaffCard";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Users, BookOpen, Target } from "lucide-react";
import communityImage from "@/assets/community.jpg";
import revJosephImage from "@/assets/rev-joseph.jpg";
import revVanDuhCeuImage from "@/assets/rev-van-duh-ceu.jpg";
const About = () => {
  const [selectedDepartment, setSelectedDepartment] = useState("pastors");

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
    youth: Array(12).fill(null).map((_, i) => ({
      name: `Youth Leader ${i + 1}`,
      role: "Youth Ministry"
    })),
    children: Array(10).fill(null).map((_, i) => ({
      name: `Children's Ministry ${i + 1}`,
      role: "Children's Ministry"
    })),
    mission: Array(7).fill(null).map((_, i) => ({
      name: `Mission Member ${i + 1}`,
      role: "Mission Team"
    })),
    building: Array(12).fill(null).map((_, i) => ({
      name: `Building Committee ${i + 1}`,
      role: "Building Committee"
    })),
    culture: Array(6).fill(null).map((_, i) => ({
      name: `Culture & Literature ${i + 1}`,
      role: "Culture & Literature"
    })),
    auditors: Array(2).fill(null).map((_, i) => ({
      name: `Auditor ${i + 1}`,
      role: "Financial Auditor"
    }))
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

      {/* Our Staff */}
      <section className="py-20 bg-secondary">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold mb-4">Our Staff</h2>
            <p className="text-muted-foreground text-lg">
              Meet the dedicated servants leading our church family
            </p>
          </div>

          <div className="max-w-md mx-auto mb-8">
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pastors">Pastors</SelectItem>
                <SelectItem value="deacons">Deacons</SelectItem>
                <SelectItem value="women">Women</SelectItem>
                <SelectItem value="youth">Youth</SelectItem>
                <SelectItem value="children">Children</SelectItem>
                <SelectItem value="mission">Mission</SelectItem>
                <SelectItem value="building">Building</SelectItem>
                <SelectItem value="culture">Culture</SelectItem>
                <SelectItem value="auditors">Auditors</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {selectedDepartment === "pastors" && ministries.pastors.map((member, index) => <StaffCard key={index} {...member} />)}
            {selectedDepartment === "deacons" && ministries.deacons.map((member, index) => <StaffCard key={index} {...member} />)}
            {selectedDepartment === "women" && ministries.women.map((member, index) => <StaffCard key={index} {...member} />)}
            {selectedDepartment === "youth" && ministries.youth.map((member, index) => <StaffCard key={index} {...member} />)}
            {selectedDepartment === "children" && ministries.children.map((member, index) => <StaffCard key={index} {...member} />)}
            {selectedDepartment === "mission" && ministries.mission.map((member, index) => <StaffCard key={index} {...member} />)}
            {selectedDepartment === "building" && ministries.building.map((member, index) => <StaffCard key={index} {...member} />)}
            {selectedDepartment === "culture" && ministries.culture.map((member, index) => <StaffCard key={index} {...member} />)}
            {selectedDepartment === "auditors" && ministries.auditors.map((member, index) => <StaffCard key={index} {...member} />)}
          </div>
        </div>
      </section>

      <Footer />
    </div>;
};
export default About;