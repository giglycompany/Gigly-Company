import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Users, Briefcase, Eye, Flame, Shield, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { MatchRecord, UserProfile } from '../types';

interface AdminDashboardProps {
  onBackToApp: () => void;
  matches: MatchRecord[];
  currentProfile: UserProfile;
}

export function AdminDashboard({ onBackToApp, matches, currentProfile }: AdminDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const offersScrollRef = useRef<HTMLDivElement>(null);
  const wantsScrollRef = useRef<HTMLDivElement>(null);
  const usersScrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (ref: React.RefObject<HTMLDivElement | null>, direction: 'up' | 'down') => {
    if (ref.current) {
      ref.current.scrollBy({ top: direction === 'down' ? 90 : -90, behavior: 'smooth' });
    }
  };

  // Mock analytics dataset
  const stats = {
    totalVisits: 142,
    uniqueVisitors: 89,
    totalUsers: 24,
    freelancers: 16,
    businesses: 8,
    matchesMade: matches.length + 18,
  };

  const servicesOffered = [
    { name: 'Figma / UI Design', count: 14, percent: 35 },
    { name: 'React / Frontend', count: 12, percent: 30 },
    { name: 'Copywriting / SEO', count: 8, percent: 20 },
    { name: 'Video / Motion', count: 6, percent: 15 },
    { name: 'Brand Strategy & Identity', count: 5, percent: 12 },
    { name: 'Mobile App (iOS / Flutter)', count: 4, percent: 10 },
    { name: '3D Illustration & Blender', count: 3, percent: 8 },
    { name: 'Translation & Localization', count: 2, percent: 6 },
    { name: 'Voiceover & Audio Editing', count: 2, percent: 5 },
    { name: 'Email Marketing & Klaviyo', count: 1, percent: 4 },
  ];

  const servicesWanted = [
    { name: 'Full-stack Dev', count: 10, percent: 38 },
    { name: 'Product Design', count: 8, percent: 30 },
    { name: 'Automation / Python', count: 5, percent: 19 },
    { name: 'Marketing / Growth', count: 3, percent: 13 },
    { name: 'AI & Prompt Engineering', count: 3, percent: 11 },
    { name: 'SEO & Content Writing', count: 2, percent: 9 },
    { name: 'DevOps & AWS Cloud', count: 2, percent: 8 },
    { name: 'Graphic & Social Media Design', count: 2, percent: 7 },
    { name: 'Cybersecurity Audit', count: 1, percent: 4 },
    { name: 'Custom Shopify Theme', count: 1, percent: 3 },
  ];

  const mockUsers = [
    {
      name: currentProfile.name || 'Yash S.',
      email: currentProfile.email || 'giglycompany@gmail.com',
      role: currentProfile.role || 'freelancer',
      rateOrBudget: currentProfile.rateOrBudget || '$55–70 / hr',
      provider: 'Google / Email',
      joined: 'Just now',
    },
    {
      name: 'Aria Chen',
      email: 'aria.chen@example.com',
      role: 'freelancer',
      rateOrBudget: '$70–90/hr',
      provider: 'Google',
      joined: '2 hours ago',
    },
    {
      name: 'Bramble Co.',
      email: 'hi@bramble.co',
      role: 'business',
      rateOrBudget: '$900–3,000/proj',
      provider: 'Email',
      joined: '1 day ago',
    },
    {
      name: 'Marcus Reed',
      email: 'marcus.code@gmail.com',
      role: 'freelancer',
      rateOrBudget: '$40–55/hr',
      provider: 'Google',
      joined: '2 days ago',
    },
    {
      name: 'Runway Labs',
      email: 'talent@runwaylabs.io',
      role: 'business',
      rateOrBudget: '$1,500 fixed',
      provider: 'Google',
      joined: '3 days ago',
    },
    {
      name: 'Elena Rostova',
      email: 'elena.design@studio.io',
      role: 'freelancer',
      rateOrBudget: '$65–85/hr',
      provider: 'Google',
      joined: '4 days ago',
    },
    {
      name: 'Nova Brands Inc.',
      email: 'hello@novabrands.com',
      role: 'business',
      rateOrBudget: '$2,500/mo',
      provider: 'Email',
      joined: '5 days ago',
    },
    {
      name: 'Kenji Sato',
      email: 'kenji.dev@tokyo.jp',
      role: 'freelancer',
      rateOrBudget: '$90–120/hr',
      provider: 'Google',
      joined: '6 days ago',
    },
    {
      name: 'Apex AI Ventures',
      email: 'founders@apexventures.ai',
      role: 'business',
      rateOrBudget: '$5,000 fixed',
      provider: 'Google',
      joined: '1 week ago',
    },
    {
      name: 'Zara Thorne',
      email: 'zara.copy@wordcraft.me',
      role: 'freelancer',
      rateOrBudget: '$50–65/hr',
      provider: 'Email',
      joined: '1 week ago',
    },
  ];

  const filteredUsers = mockUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full max-w-[680px] mx-auto min-h-screen p-4 sm:p-6 pb-20 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-dashed border-black/15">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToApp}
            className="w-10 h-10 rounded-full bg-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000] hover:translate-y-[-1px] cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-black" />
          </button>
          <div>
            <h1 className="font-display font-[800] text-[22px] text-black flex items-center gap-2">
              <span>📊 Gigly Admin</span>
              <span className="px-2 py-0.5 rounded-full bg-[#FFC629] border border-black text-[10px] font-bold">
                Live
              </span>
            </h1>
            <p className="text-[12px] font-semibold text-[#6E6E6E]">
              Analytics, active users & platform health
            </p>
          </div>
        </div>

        <button
          onClick={onBackToApp}
          className="px-4 py-2 bg-white text-black font-display font-bold text-[12.5px] rounded-full border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:bg-[#FFC629] transition-colors"
        >
          Exit Dashboard
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white border-[2.5px] border-black rounded-[18px] p-4 shadow-[3px_4px_0px_0px_#000]">
          <span className="text-[24px] font-display font-[800] text-black block">
            {stats.totalVisits}
          </span>
          <span className="text-[11px] font-bold text-[#6E6E6E] uppercase tracking-wider">
            Total Visits
          </span>
        </div>

        <div className="bg-white border-[2.5px] border-black rounded-[18px] p-4 shadow-[3px_4px_0px_0px_#000]">
          <span className="text-[24px] font-display font-[800] text-black block">
            {stats.uniqueVisitors}
          </span>
          <span className="text-[11px] font-bold text-[#6E6E6E] uppercase tracking-wider">
            Unique Visitors
          </span>
        </div>

        <div className="bg-white border-[2.5px] border-black rounded-[18px] p-4 shadow-[3px_4px_0px_0px_#000]">
          <span className="text-[24px] font-display font-[800] text-black block">
            {stats.totalUsers}
          </span>
          <span className="text-[11px] font-bold text-[#6E6E6E] uppercase tracking-wider">
            Signed-up Users
          </span>
        </div>

        <div className="bg-white border-[2.5px] border-black rounded-[18px] p-4 shadow-[3px_4px_0px_0px_#000]">
          <span className="text-[24px] font-display font-[800] text-black block">
            {stats.freelancers}
          </span>
          <span className="text-[11px] font-bold text-[#6E6E6E] uppercase tracking-wider">
            Freelancers
          </span>
        </div>

        <div className="bg-white border-[2.5px] border-black rounded-[18px] p-4 shadow-[3px_4px_0px_0px_#000]">
          <span className="text-[24px] font-display font-[800] text-black block">
            {stats.businesses}
          </span>
          <span className="text-[11px] font-bold text-[#6E6E6E] uppercase tracking-wider">
            Businesses
          </span>
        </div>

        <div className="bg-white border-[2.5px] border-black rounded-[18px] p-4 shadow-[3px_4px_0px_0px_#000]">
          <span className="text-[24px] font-display font-[800] text-[#000] block">
            {stats.matchesMade}
          </span>
          <span className="text-[11px] font-bold text-[#6E6E6E] uppercase tracking-wider">
            Matches Made
          </span>
        </div>
      </div>

      {/* Visual Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Offered Skills */}
        <div className="bg-white border-[2.5px] border-black rounded-[20px] p-5 shadow-[4px_5px_0px_0px_#000]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-[800] text-[14px] text-black">
              Services Freelancers are Offering
            </h3>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleScroll(offersScrollRef, 'up')}
                className="w-6 h-6 rounded-md bg-[#FFFCF5] border border-black flex items-center justify-center hover:bg-[#FFC629] active:scale-95 transition-all shadow-[1px_1px_0px_0px_#000] cursor-pointer"
                title="Scroll Up"
              >
                <ChevronUp className="w-3.5 h-3.5 text-black" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll(offersScrollRef, 'down')}
                className="w-6 h-6 rounded-md bg-[#FFFCF5] border border-black flex items-center justify-center hover:bg-[#FFC629] active:scale-95 transition-all shadow-[1px_1px_0px_0px_#000] cursor-pointer"
                title="Scroll Down"
              >
                <ChevronDown className="w-3.5 h-3.5 text-black" />
              </button>
            </div>
          </div>
          <div ref={offersScrollRef} className="h-[160px] overflow-y-auto custom-scrollbar-y force-scrollbar-y pr-2 space-y-2.5">
            {servicesOffered.map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-[12px] font-bold text-black mb-1">
                  <span>{item.name}</span>
                  <span className="text-[#6E6E6E]">{item.percent}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#FFFCF5] border border-black rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#FFC629] border-r border-black"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wanted Skills */}
        <div className="bg-white border-[2.5px] border-black rounded-[20px] p-5 shadow-[4px_5px_0px_0px_#000]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-[800] text-[14px] text-black">
              Services Businesses Want
            </h3>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleScroll(wantsScrollRef, 'up')}
                className="w-6 h-6 rounded-md bg-[#FFFCF5] border border-black flex items-center justify-center hover:bg-[#FFC629] active:scale-95 transition-all shadow-[1px_1px_0px_0px_#000] cursor-pointer"
                title="Scroll Up"
              >
                <ChevronUp className="w-3.5 h-3.5 text-black" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll(wantsScrollRef, 'down')}
                className="w-6 h-6 rounded-md bg-[#FFFCF5] border border-black flex items-center justify-center hover:bg-[#FFC629] active:scale-95 transition-all shadow-[1px_1px_0px_0px_#000] cursor-pointer"
                title="Scroll Down"
              >
                <ChevronDown className="w-3.5 h-3.5 text-black" />
              </button>
            </div>
          </div>
          <div ref={wantsScrollRef} className="h-[160px] overflow-y-auto custom-scrollbar-y force-scrollbar-y pr-2 space-y-2.5">
            {servicesWanted.map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-[12px] font-bold text-black mb-1">
                  <span>{item.name}</span>
                  <span className="text-[#6E6E6E]">{item.percent}%</span>
                </div>
                <div className="w-full h-2.5 bg-[#FFFCF5] border border-black rounded-full overflow-hidden">
                  <div
                    className="h-full bg-black"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border-[2.5px] border-black rounded-[20px] p-5 shadow-[4px_5px_0px_0px_#000] mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="font-display font-[800] text-[15px] text-black">
            Registered Users ({filteredUsers.length})
          </h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-black absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search users..."
                className="pl-9 pr-3 py-1.5 bg-[#FFFCF5] border-[1.5px] border-black rounded-full text-[12px] font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFC629]"
              />
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleScroll(usersScrollRef, 'up')}
                className="w-7 h-7 rounded-md bg-[#FFFCF5] border border-black flex items-center justify-center hover:bg-[#FFC629] active:scale-95 transition-all shadow-[1px_1px_0px_0px_#000] cursor-pointer"
                title="Scroll Table Up"
              >
                <ChevronUp className="w-4 h-4 text-black" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll(usersScrollRef, 'down')}
                className="w-7 h-7 rounded-md bg-[#FFFCF5] border border-black flex items-center justify-center hover:bg-[#FFC629] active:scale-95 transition-all shadow-[1px_1px_0px_0px_#000] cursor-pointer"
                title="Scroll Table Down"
              >
                <ChevronDown className="w-4 h-4 text-black" />
              </button>
            </div>
          </div>
        </div>

        <div ref={usersScrollRef} className="h-[220px] overflow-y-auto custom-scrollbar-y force-scrollbar-y custom-scrollbar-x pr-1 pb-1">
          <table className="w-full text-left text-[12px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#FFC629] border-b-2 border-black font-display font-bold text-black shadow-sm">
                <th className="p-2.5 rounded-l-lg">User</th>
                <th className="p-2.5">Email</th>
                <th className="p-2.5">Role</th>
                <th className="p-2.5">Rate/Budget</th>
                <th className="p-2.5 rounded-r-lg">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {filteredUsers.map((u, i) => (
                <tr key={i} className="hover:bg-[#FFFCF5] transition-colors">
                  <td className="p-2.5 font-bold text-black">{u.name}</td>
                  <td className="p-2.5 text-[#6E6E6E] font-medium">{u.email}</td>
                  <td className="p-2.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        u.role === 'freelancer'
                          ? 'bg-[#FFF9E6] border-black text-black'
                          : 'bg-black text-[#FFC629] border-black'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-2.5 font-semibold text-black">{u.rateOrBudget}</td>
                  <td className="p-2.5 text-[#6E6E6E]">{u.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
