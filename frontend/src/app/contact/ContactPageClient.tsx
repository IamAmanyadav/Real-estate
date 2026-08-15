"use client";

import { motion } from "framer-motion";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import ContactForm from "@/components/contact/ContactForm";

const contactInfo = [
  {
  {
    icon: Phone,
    title: "Call Us",
    details: ["+91 93366 94250", "+91 82995 14092", "+91 90266 52103", "+91 95110 73317"],
  },
  {
    icon: Mail,
    title: "Email Us",
    details: ["ay279754@gmail.com", "ishuthapa877@gmail.com", "pradeepydv014@gmail.com"],
  },
  {
    icon: Clock,
    title: "Working Hours",
    details: ["Mon - Fri: 9AM - 6PM", "Sat - Sun: 10AM - 12PM"],
  },
];

export default function ContactPageClient() {
  return (
    <div className="pt-24 pb-16">
      {/* Hero */}
      <section className="relative py-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-background dark:from-emerald-950/20 dark:via-background dark:to-background" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Contact Us
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold mt-3 mb-4">
              Get in{" "}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                Touch
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Have questions about a property or need expert advice? Our team is
              here to help you every step of the way.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {contactInfo.map((info, i) => (
            <motion.div
              key={info.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="h-full border-border/50 hover:border-emerald-300 dark:hover:border-emerald-800 transition-colors text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                    <info.icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="font-semibold mb-2">{info.title}</h3>
                  {info.details.map((d) => (
                    <p key={d} className="text-sm text-muted-foreground">
                      {d}
                    </p>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Contact Form Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Send Us a Message
            </h2>
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Fill out the form and our team will get back to you within 24
              hours. Whether you&apos;re looking to buy, sell, or just have
              questions, we&apos;re here to help.
            </p>
            <ContactForm />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative rounded-2xl overflow-hidden bg-muted min-h-[400px] flex items-center justify-center"
          >
            {/* Map placeholder with elegant gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-950/30 dark:to-teal-950/30" />
            <div className="relative text-center p-8">
              <MapPin className="w-16 h-16 text-emerald-500/30 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">Our Location</h3>
              <p className="text-muted-foreground text-sm">
                Gorakhpur, Uttar Pradesh
              </p>
              <p className="text-muted-foreground text-xs mt-2">
                Interactive map coming soon
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
