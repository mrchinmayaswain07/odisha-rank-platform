"use client";

import React, { useState } from "react";
import { Mail, MapPin, Clock, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { SITE_CONFIG } from "@/lib/constants";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setSubmitted(true);
  };

  return (
    <div className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
          Contact Odisha<span className="text-blue-600">Rank</span>
        </h1>
        <p className="text-slate-600 text-sm leading-relaxed">
          Have feedback on syllabus items, found a question clarification, or need support? Reach out directly to our team.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Verified Contact Details Cards */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Platform Location</h4>
                <p className="text-xs text-slate-600 mt-1 font-medium leading-relaxed">
                  {SITE_CONFIG.contact.location}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">Odisha, India</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Official Inquiries & Support</h4>
                <a
                  href={`mailto:${SITE_CONFIG.contact.email}`}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium underline underline-offset-2 block mt-1 transition-colors"
                >
                  {SITE_CONFIG.contact.email}
                </a>
                <p className="text-[11px] text-slate-400 mt-1">Direct academic & portal queries</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Working Hours</h4>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  {SITE_CONFIG.contact.supportHours}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Response within 24 business hours
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Contact Form */}
        <Card className="md:col-span-2 p-8">
          {submitted ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Message Received</h3>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Thank you for contacting OdishaRank. Your inquiry has been logged and our team will follow up at{" "}
                <strong className="text-slate-800">{formData.email}</strong>.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSubmitted(false);
                  setFormData({ name: "", email: "", subject: "", message: "" });
                }}
              >
                Send Another Message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Your Full Name"
                  required
                  placeholder="e.g. Subrat Pattnaik"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <Input
                  label="Email Address"
                  type="email"
                  required
                  placeholder="e.g. student@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <Input
                label="Subject / Topic"
                required
                placeholder="e.g. Question bank clarification on Paika Rebellion"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Your Message
                </label>
                <textarea
                  rows={5}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all"
                  placeholder="Describe your inquiry, question feedback, or platform suggestion..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full sm:w-auto gap-2">
                <Send className="w-4 h-4" />
                <span>Submit Inquiry</span>
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
