import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] as const }
  })
};

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };

interface BeliefSection {
  number: number;
  title: string;
  content: string[];
  verses: string[];
}

const beliefs: BeliefSection[] = [
  {
    number: 1,
    title: "The Holy Scriptures",
    content: [
      "We believe the Bible is the inspired, inerrant, and infallible Word of God. It was written by human authors under the supernatural guidance of the Holy Spirit and is the supreme authority in all matters of faith and conduct. The Scriptures reveal God's character, His plan of redemption, and His will for humanity."
    ],
    verses: [
      '"All Scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness." (2 Timothy 3:16)'
    ]
  },
  {
    number: 2,
    title: "The One True God",
    content: [
      "We believe there is one and only one living and true God, eternally existing in three Persons: Father, Son, and Holy Spirit. These three are equal in power and glory and are worthy of all worship, honor, and obedience."
    ],
    verses: [
      '"Go therefore and make disciples of all nations, baptizing them in the name of the Father and of the Son and of the Holy Spirit." (Matthew 28:19)',
      '"Hear, O Israel: The Lord our God, the Lord is one!" (Deuteronomy 6:4)'
    ]
  },
  {
    number: 3,
    title: "Jesus Christ",
    content: [
      "We believe in the Lord Jesus Christ, the eternal Son of God. He was conceived by the Holy Spirit, born of the virgin Mary, and is fully God and fully man. He lived a sinless life, performed miracles, and willingly offered Himself as the atoning sacrifice for the sins of the world through His death on the cross. He was bodily raised from the dead, ascended into heaven, and will return personally and visibly in power and glory."
    ],
    verses: [
      '"But Peter arose and ran to the tomb; and stooping down, he saw the linen cloths lying by themselves; and he departed, marveling to himself at what had happened." (Luke 24:12)',
      '"This same Jesus, who was taken up from you into heaven, will so come in like manner as you saw Him go into heaven." (Acts 1:11)'
    ]
  },
  {
    number: 4,
    title: "The Holy Spirit",
    content: [
      "We believe the Holy Spirit convicts the world of sin, righteousness, and judgment. He regenerates, indwells, seals, and empowers believers for godly living and service. The Spirit equips the church with spiritual gifts for the building up of the body of Christ."
    ],
    verses: [
      '"And when He has come, He will convict the world of sin, and of righteousness, and of judgment." (John 16:8)'
    ]
  },
  {
    number: 5,
    title: "Humanity and Sin",
    content: [
      "We believe that humanity was created in the image of God and is the crowning work of His creation. Through voluntary disobedience, all people became sinners by nature and by choice. As a result, humanity is separated from God and in need of salvation."
    ],
    verses: [
      '"So God created man in His own image; in the image of God He created him; male and female He created them." (Genesis 1:27)'
    ]
  },
  {
    number: 6,
    title: "Salvation",
    content: [
      "We believe that salvation is the gift of God's grace, received through faith in Jesus Christ alone. It cannot be earned through works or human effort. All who repent of their sins and trust in Christ are justified, forgiven, adopted into God's family, and eternally secure in Him."
    ],
    verses: [
      '"For God so loved the world that He gave His only begotten Son, that whoever believes in Him should not perish but have everlasting life." (John 3:16)'
    ]
  },
  {
    number: 7,
    title: "The Church",
    content: [
      "We believe the church is the body of Christ, composed of all believers. The local church is an autonomous congregation of baptized believers, governed under the Lordship of Christ. The mission of the church is to glorify God through worship, discipleship, fellowship, service, and the proclamation of the gospel to all nations."
    ],
    verses: [
      '"Go therefore and make disciples of all nations…" (Matthew 28:19)',
      '"Now you are the body of Christ, and members individually." (1 Corinthians 12:27)'
    ]
  },
  {
    number: 8,
    title: "The Ordinances",
    content: [
      "We believe that the Lord Jesus Christ instituted two ordinances for the church:",
      "Believer's Baptism – The immersion of a believer in water in the name of the Father, Son, and Holy Spirit, symbolizing the believer's faith in the crucified, buried, and risen Savior. (Matthew 28:19)",
      "The Lord's Supper – A symbolic act of obedience in which believers partake of the bread and cup in remembrance of Christ's sacrifice."
    ],
    verses: [
      '"And as they were eating, Jesus took bread, blessed and broke it, and gave it to the disciples and said, \'Take, eat; this is My body.\'" (Matthew 26:26)'
    ]
  },
  {
    number: 9,
    title: "The Priesthood of All Believers",
    content: [
      "We believe that all believers have direct access to God through Jesus Christ and are called to serve Him as priests, offering spiritual sacrifices acceptable to God."
    ],
    verses: [
      '"You also, as living stones, are being built up a spiritual house, a holy priesthood, to offer up spiritual sacrifices acceptable to God through Jesus Christ." (1 Peter 2:5)'
    ]
  },
  {
    number: 10,
    title: "Marriage and Family",
    content: [
      "We believe that God created marriage to be a sacred covenant between one man and one woman. Marriage is designed by God to reflect His purposes for companionship, family, and moral purity."
    ],
    verses: [
      '"Have you not read that He who made them at the beginning \'made them male and female,\' and said, \'For this reason a man shall leave his father and mother and be joined to his wife, and the two shall become one flesh\'?" (Matthew 19:4–5)'
    ]
  }
];

const StatementOfFaith = () => {
  const [textSize, setTextSize] = useState<"sm" | "default" | "lg" | "xl" | "2xl">("default");

  const textSizeClasses = {
    sm: "text-sm leading-relaxed",
    default: "text-base leading-relaxed",
    lg: "text-lg leading-relaxed",
    xl: "text-xl leading-relaxed",
    "2xl": "text-2xl leading-relaxed"
  };

  const verseSizeClasses = {
    sm: "text-xs",
    default: "text-sm",
    lg: "text-base",
    xl: "text-lg",
    "2xl": "text-xl"
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero */}
      <section className="relative mt-20 overflow-hidden bg-primary">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,_hsl(210_55%_35%/0.6)_0%,_transparent_70%)]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 container mx-auto px-8 md:px-16 py-16 md:py-20 max-w-4xl text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary-foreground/10 flex items-center justify-center mx-auto mb-5">
            <BookOpen className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-3 leading-[1.1]">
            Statement of Faith
          </h1>
          <p className="text-primary-foreground/60 max-w-lg mx-auto text-base">
            The core beliefs that guide our church and define our mission
          </p>
        </motion.div>
      </section>

      {/* Content */}
      <section className="py-12 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-3xl mx-auto space-y-10">
            {/* Text Size Controller */}
            <motion.div variants={fadeUp} custom={0} className="flex justify-end">
              <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1">
                <button
                  onClick={() => setTextSize("sm")}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${textSize === "sm" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                >
                  A-
                </button>
                <button
                  onClick={() => setTextSize("default")}
                  className={`px-2.5 py-1 rounded-md text-sm font-medium transition-colors ${textSize === "default" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                >
                  A
                </button>
                <button
                  onClick={() => setTextSize("lg")}
                  className={`px-2.5 py-1 rounded-md text-base font-medium transition-colors ${textSize === "lg" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                >
                  A+
                </button>
                <button
                  onClick={() => setTextSize("xl")}
                  className={`px-2.5 py-1 rounded-md text-lg font-medium transition-colors ${textSize === "xl" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                >
                  A++
                </button>
                <button
                  onClick={() => setTextSize("2xl")}
                  className={`px-2.5 py-1 rounded-md text-xl font-medium transition-colors ${textSize === "2xl" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                >
                  A+++
                </button>
              </div>
            </motion.div>

            {beliefs.map((belief, i) => (
              <motion.article
                key={belief.number}
                variants={fadeUp}
                custom={i + 1}
                className="group"
              >
                <div className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center mt-0.5">
                    {belief.number}
                  </span>
                  <div className="space-y-3 flex-1">
                    <h2 className="font-display text-xl md:text-2xl font-bold text-foreground">
                      {belief.title}
                    </h2>
                    {belief.content.map((paragraph, j) => (
                      <p key={j} className={`text-muted-foreground ${textSizeClasses[textSize]}`}>
                        {paragraph}
                      </p>
                    ))}
                    <div className="space-y-2 pt-1">
                      {belief.verses.map((verse, k) => (
                        <blockquote
                          key={k}
                          className={`border-l-2 border-primary/30 pl-4 ${verseSizeClasses[textSize]} text-muted-foreground/80 italic`}
                        >
                          {verse}
                        </blockquote>
                      ))}
                    </div>
                  </div>
                </div>
                {i < beliefs.length - 1 && (
                  <div className="mt-8 border-b border-border/50" />
                )}
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default StatementOfFaith;
