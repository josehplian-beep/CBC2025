import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Heart, Users, Cross, Flame, Gift, Church, Droplets, KeyRound, Home, BookOpen } from "lucide-react";
import TextSizeControl from "@/components/TextSizeControl";


interface BeliefSection {
  number: number;
  title: string;
  icon: React.ElementType;
  content: string[];
  verses: string[];
}

const beliefs: BeliefSection[] = [
  {
    number: 1, title: "The Holy Scriptures", icon: BookOpen,
    content: ["We believe the Bible is the inspired, inerrant, and infallible Word of God. It was written by human authors under the supernatural guidance of the Holy Spirit and is the supreme authority in all matters of faith and conduct. The Scriptures reveal God's character, His plan of redemption, and His will for humanity."],
    verses: ['"All Scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness." (2 Timothy 3:16)']
  },
  {
    number: 2, title: "The One True God", icon: Heart,
    content: ["We believe there is one and only one living and true God, eternally existing in three Persons: Father, Son, and Holy Spirit. These three are equal in power and glory and are worthy of all worship, honor, and obedience."],
    verses: ['"Go therefore and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit." (Matthew 28:19)', '"Hear, O Israel: The Lord our God, the Lord is one!" (Deuteronomy 6:4)']
  },
  {
    number: 3, title: "Jesus Christ", icon: Cross,
    content: ["We believe in the Lord Jesus Christ, the eternal Son of God. He was conceived by the Holy Spirit, born of the virgin Mary, and is fully God and fully man. He lived a sinless life, performed miracles, and willingly offered Himself as the atoning sacrifice for the sins of the world through His death on the cross. He was bodily raised from the dead, ascended into heaven, and will return personally and visibly in power and glory."],
    verses: ['"But Peter arose and ran to the tomb; and stooping down, he saw the linen cloths lying by themselves; and he departed, marveling to himself at what had happened." (Luke 24:12)', '"This same Jesus, who was taken up from you into heaven, will so come in like manner as you saw Him go into heaven." (Acts 1:11)']
  },
  {
    number: 4, title: "The Holy Spirit", icon: Flame,
    content: ["We believe the Holy Spirit convicts the world of sin, righteousness, and judgment. He regenerates, indwells, seals, and empowers believers for godly living and service. The Spirit equips the church with spiritual gifts for the building up of the body of Christ."],
    verses: ['"And when He has come, He will convict the world of sin, and of righteousness, and of judgment." (John 16:8)']
  },
  {
    number: 5, title: "Humanity and Sin", icon: Users,
    content: ["We believe that humanity was created in the image of God and is the crowning work of His creation. Through voluntary disobedience, all people became sinners by nature and by choice. As a result, humanity is separated from God and in need of salvation."],
    verses: ['"So God created man in His own image; in the image of God He created him; male and female He created them." (Genesis 1:27)']
  },
  {
    number: 6, title: "Salvation", icon: Gift,
    content: ["We believe that salvation is the gift of God's grace, received through faith in Jesus Christ alone. It cannot be earned through works or human effort. All who repent of their sins and trust in Christ are justified, forgiven, adopted into God's family, and eternally secure in Him."],
    verses: ['"For God so loved the world that He gave His only begotten Son, that whoever believes in Him should not perish but have everlasting life." (John 3:16)']
  },
  {
    number: 7, title: "The Church", icon: Church,
    content: ["We believe the church is the body of Christ, composed of all believers. The local church is an autonomous congregation of baptized believers, governed under the Lordship of Christ. The mission of the church is to glorify God through worship, discipleship, fellowship, service, and the proclamation of the gospel to all nations."],
    verses: ['"Go therefore and make disciples of all nations…" (Matthew 28:19)', '"Now you are the body of Christ, and members individually." (1 Corinthians 12:27)']
  },
  {
    number: 8, title: "The Ordinances", icon: Droplets,
    content: ["We believe that the Lord Jesus Christ instituted two ordinances for the church:", "Believer's Baptism – The immersion of a believer in water in the name of the Father, Son, and Holy Spirit, symbolizing the believer's faith in the crucified, buried, and risen Savior. (Matthew 28:19)", "The Lord's Supper – A symbolic act of obedience in which believers partake of the bread and cup in remembrance of Christ's sacrifice."],
    verses: ['"And as they were eating, Jesus took bread, blessed and broke it, and gave it to the disciples and said, \'Take, eat; this is My body.\'" (Matthew 26:26)']
  },
  {
    number: 9, title: "The Priesthood of All Believers", icon: KeyRound,
    content: ["We believe that all believers have direct access to God through Jesus Christ and are called to serve Him as priests, offering spiritual sacrifices acceptable to God."],
    verses: ['"You also, as living stones, are being built up a spiritual house, a holy priesthood, to offer up spiritual sacrifices acceptable to God through Jesus Christ." (1 Peter 2:5)']
  },
  {
    number: 10, title: "Marriage and Family", icon: Home,
    content: ["We believe that God created marriage to be a sacred covenant between one man and one woman. Marriage is designed by God to reflect His purposes for companionship, family, and moral purity."],
    verses: ['"Have you not read that He who made them at the beginning \'made them male and female,\' and said, \'For this reason a man shall leave his father and mother and be joined to his wife, and the two shall become one flesh\'?" (Matthew 19:4–5)']
  }
];

const StatementOfFaith = () => {
  const [textScale, setTextScale] = useState(1);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero */}
      <section className="mt-20 bg-primary">
        <div className="container mx-auto px-6 py-16 md:py-20 max-w-3xl text-center">
          <h1 className="font-display text-3xl md:text-5xl font-bold text-primary-foreground mb-3">
            Statement of Faith
          </h1>
          <p className="text-primary-foreground/60 max-w-md mx-auto">
            The core beliefs that guide our church and define our mission
          </p>
        </div>
      </section>


      {/* Content */}
      <section className="py-12 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto space-y-4">
            {/* Text Size Controller */}
            <div className="flex justify-end mb-6">
              <TextSizeControl scale={textScale} onChange={setTextScale} />
            </div>

            {beliefs.map((belief, i) => {
              const Icon = belief.icon;
              const isExpanded = expandedIndex === i;

              return (
                <div
                  key={belief.number}
                  id={`belief-${belief.number}`}
                >
                  <div
                    className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                      isExpanded
                        ? 'bg-card border-primary/20 shadow-lg shadow-primary/5'
                        : 'bg-card/50 border-border/50 hover:border-border hover:bg-card hover:shadow-md'
                    }`}
                  >
                    {/* Header - always visible */}
                    <button
                      onClick={() => toggleExpand(i)}
                      className="w-full flex items-center gap-4 p-5 md:p-6 text-left group"
                    >
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isExpanded
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'bg-primary/8 text-primary group-hover:bg-primary/15'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold uppercase tracking-wider transition-colors ${
                            isExpanded ? 'text-primary' : 'text-muted-foreground/60'
                          }`}>
                            Article {belief.number}
                          </span>
                        </div>
                        <h2 className="font-display text-lg md:text-xl font-bold text-foreground mt-0.5 truncate">
                          {belief.title}
                        </h2>
                      </div>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="flex-shrink-0"
                      >
                        <ChevronDown className={`w-5 h-5 transition-colors ${isExpanded ? 'text-primary' : 'text-muted-foreground/40'}`} />
                      </motion.div>
                    </button>

                    {/* Expandable Content */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 md:px-6 pb-6 pt-0">
                            <div className="border-t border-border/50 pt-5 space-y-4">
                              {belief.content.map((paragraph, j) => (
                                <motion.p
                                  key={j}
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: j * 0.08 + 0.1, duration: 0.4 }}
                                  className="text-muted-foreground leading-relaxed"
                                  style={{ fontSize: `${textScale}rem`, lineHeight: '1.85' }}
                                >
                                  {paragraph}
                                </motion.p>
                              ))}

                              <div className="space-y-3 pt-2">
                                {belief.verses.map((verse, k) => (
                                  <motion.blockquote
                                    key={k}
                                    initial={{ opacity: 0, x: -12 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: k * 0.1 + 0.25, duration: 0.4 }}
                                    className="border-l-3 border-primary/40 pl-5 py-2 bg-primary/[0.03] rounded-r-lg"
                                    style={{ fontSize: `${textScale * 0.875}rem`, lineHeight: '1.75' }}
                                  >
                                    <p className="text-muted-foreground/70 italic">
                                      {verse}
                                    </p>
                                  </motion.blockquote>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default StatementOfFaith;
