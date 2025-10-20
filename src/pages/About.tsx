import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import StaffCard from "@/components/StaffCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Users, BookOpen, Target } from "lucide-react";
import communityImage from "@/assets/community.jpg";
import revJosephImage from "@/assets/rev-joseph.jpg";
import revVanDuhCeuImage from "@/assets/rev-van-duh-ceu.jpg";
const About = () => {
  const ministries = {
    pastors: [{
      name: "Rev. Van Duh Ceu",
      role: "Senior Pastor",
      email: "vdc@cbc.org",
      phone: "(555) 123-4567",
      image: revVanDuhCeuImage
    }, {
      name: "Rev. Joseph Nihre Bawihrin",
      role: "Associate Pastor",
      email: "jnb@cbc.org",
      phone: "(555) 123-4568",
      image: revJosephImage
    }],
    leadership: Array(12).fill(null).map((_, i) => ({
      name: `Leadership Member ${i + 1}`,
      role: "Church Leader",
      email: `leader${i + 1}@cbc.org`
    })),
    deacons: [
      {
        name: "Upa Biak Hmung",
        role: "Chairman",
        email: "biak.hmung@cbc.org"
      },
      {
        name: "Upa Thang Er",
        role: "Vice Chairman",
        email: "thang.er@cbc.org"
      },
      {
        name: "Upa Cung Biak Thawng",
        role: "Secretary",
        email: "cung.biak.thawng@cbc.org"
      },
      {
        name: "Upa Ngunzacung",
        role: "Assistant Secretary",
        email: "ngunzacung@cbc.org"
      },
      {
        name: "Upa Dawt Hlei Sang",
        role: "Treasurer",
        email: "dawt.hlei.sang@cbc.org"
      },
      {
        name: "Upa Biak Hlun",
        role: "Assistant Treasurer",
        email: "biak.hlun@cbc.org"
      },
      {
        name: "Upa Rung Cin",
        role: "Member",
        email: "rung.cin@cbc.org"
      },
      {
        name: "Upa Zang Kung",
        role: "Member",
        email: "zang.kung@cbc.org"
      },
      {
        name: "Upa Cung Van Hmung",
        role: "Member",
        email: "cung.van.hmung@cbc.org"
      },
      {
        name: "Upa Tial Thluam",
        role: "Member",
        email: "tial.thluam@cbc.org"
      }
    ],
    women: Array(12).fill(null).map((_, i) => ({
      name: `Women's Ministry Member ${i + 1}`,
      role: "Women's Ministry",
      email: `women${i + 1}@cbc.org`
    })),
    youth: Array(12).fill(null).map((_, i) => ({
      name: `Youth Leader ${i + 1}`,
      role: "Youth Ministry",
      email: `youth${i + 1}@cbc.org`
    })),
    children: Array(10).fill(null).map((_, i) => ({
      name: `Children's Ministry ${i + 1}`,
      role: "Children's Ministry",
      email: `children${i + 1}@cbc.org`
    })),
    mission: Array(7).fill(null).map((_, i) => ({
      name: `Mission Member ${i + 1}`,
      role: "Mission Team",
      email: `mission${i + 1}@cbc.org`
    })),
    building: Array(12).fill(null).map((_, i) => ({
      name: `Building Committee ${i + 1}`,
      role: "Building Committee",
      email: `building${i + 1}@cbc.org`
    })),
    culture: Array(6).fill(null).map((_, i) => ({
      name: `Culture & Literature ${i + 1}`,
      role: "Culture & Literature",
      email: `culture${i + 1}@cbc.org`
    })),
    auditors: Array(2).fill(null).map((_, i) => ({
      name: `Auditor ${i + 1}`,
      role: "Financial Auditor",
      email: `auditor${i + 1}@cbc.org`
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

          <Tabs defaultValue="pastors" className="w-full">
            <TabsList className="grid w-full max-w-4xl mx-auto grid-cols-2 md:grid-cols-4 lg:grid-cols-8 mb-12">
              <TabsTrigger value="pastors">Pastors</TabsTrigger>
              <TabsTrigger value="deacons">Deacons</TabsTrigger>
              <TabsTrigger value="women">Women</TabsTrigger>
              <TabsTrigger value="youth">Youth</TabsTrigger>
              <TabsTrigger value="children">Children</TabsTrigger>
              <TabsTrigger value="mission">Mission</TabsTrigger>
              <TabsTrigger value="building">Building</TabsTrigger>
              <TabsTrigger value="culture">Culture</TabsTrigger>
            </TabsList>

            <TabsContent value="pastors">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ministries.pastors.map((member, index) => <StaffCard key={index} {...member} />)}
              </div>
            </TabsContent>

            <TabsContent value="deacons">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {ministries.deacons.map((member, index) => <StaffCard key={index} {...member} />)}
              </div>
            </TabsContent>

            <TabsContent value="women">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {ministries.women.map((member, index) => <StaffCard key={index} {...member} />)}
              </div>
            </TabsContent>

            <TabsContent value="youth">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {ministries.youth.map((member, index) => <StaffCard key={index} {...member} />)}
              </div>
            </TabsContent>

            <TabsContent value="children">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {ministries.children.map((member, index) => <StaffCard key={index} {...member} />)}
              </div>
            </TabsContent>

            <TabsContent value="mission">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {ministries.mission.map((member, index) => <StaffCard key={index} {...member} />)}
              </div>
            </TabsContent>

            <TabsContent value="building">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {ministries.building.map((member, index) => <StaffCard key={index} {...member} />)}
              </div>
            </TabsContent>

            <TabsContent value="culture">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ministries.culture.map((member, index) => <StaffCard key={index} {...member} />)}
              </div>
            </TabsContent>
          </Tabs>

          {/* Auditors Section - Separate since it wasn't in tabs list */}
          <div className="mt-16">
            <h3 className="font-display text-2xl font-bold mb-6 text-center">Auditors</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {ministries.auditors.map((member, index) => <StaffCard key={index} {...member} />)}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>;
};
export default About;