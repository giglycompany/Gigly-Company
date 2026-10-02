import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Users, Briefcase, Eye, Flame, Shield, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { GigItem, MatchRecord, UserProfile } from '../types';

interface AdminDashboardProps {
  onBackToApp: () => void;
  matches: MatchRecord[];
  currentProfile: UserProfile;
  jobs?: GigItem[];
  candidates?: GigItem[];
}

export function AdminDashboard({
  onBackToApp,
  matches,
  currentProfile,
  jobs = [],
  candidates = [],
}: AdminDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [firestoreGigs, setFirestoreGigs] = useState<GigItem[]>([]);

  const offersScrollRef = useRef<HTMLDivElement>(null);
  const wantsScrollRef = useRef<HTMLDivElement>(null);
  const usersScrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (ref: React.RefObject<HTMLDivElement | null>, direction: 'up' | 'down') => {
    if (ref.current) {
      ref.current.scrollBy({ top: direction === 'down' ? 90 : -90, behavior: 'smooth' });
    }
  };

  // 1. Gather all authentic users from localStorage, props, and Firestore
  useEffect(() => {
    const userMap = new Map<string, UserProfile>();

    // Add current profile if valid
    if (currentProfile && (currentProfile.email || currentProfile.name)) {
      const key = (currentProfile.email || currentProfile.name).toLowerCase();
      userMap.set(key, currentProfile);
    }

    // Scan localStorage for any saved user profiles
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('gigly_profile_')) {
          const raw = localStorage.getItem(k);
          if (raw) {
            const p = JSON.parse(raw);
            if (p && (p.email || p.name)) {
              const key = (p.email || p.name).toLowerCase();
              userMap.set(key, p);
            }
          }
        }
      }
    } catch {}

    // Query Firestore users collection (with offline/network safety)
    try {
      getDocs(collection(db, 'users'))
        .then((snap) => {
          if (!snap.empty) {
            snap.forEach((docSnap) => {
              const data = docSnap.data() as UserProfile;
              if (data && (data.email || data.name)) {
                const key = (data.email || data.name).toLowerCase();
                userMap.set(key, data);
              }
            });
            setAllUsers(Array.from(userMap.values()));
          }
        })
        .catch(() => {
          // Graceful fallback to local profiles
        });
    } catch {}

    // Query Firestore gigs collection
    try {
      getDocs(collection(db, 'gigs'))
        .then((snap) => {
          if (!snap.empty) {
            const loaded: GigItem[] = [];
            snap.forEach((docSnap) => {
              const d = docSnap.data();
              if (!docSnap.id.startsWith('job-') && !docSnap.id.startsWith('cand-')) {
                loaded.push({
                  id: docSnap.id,
                  rate: d.rate || '$50',
                  unit: d.unit || '/hr',
                  title: d.title || '',
                  client: d.client || '',
                  category: d.category || 'Others',
                  tags: d.tags || [],
                  desc: d.desc || '',
                  posted: d.posted || 'recently',
                  proposals: d.proposals || 'open',
                  hot: Boolean(d.hot),
                  type: d.type,
                });
              }
            });
            setFirestoreGigs(loaded);
          }
        })
        .catch(() => {});
    } catch {}

    setAllUsers(Array.from(userMap.values()));
  }, [currentProfile]);

  // Combined real users list
  const combinedUsers = useMemo(() => {
    if (allUsers.length > 0) return allUsers;
    if (currentProfile && (currentProfile.email || currentProfile.name)) {
      return [currentProfile];
    }
    return [];
  }, [allUsers, currentProfile]);

  const freelancersCount = combinedUsers.filter((u) => u.role === 'freelancer').length;
  const businessesCount = combinedUsers.filter((u) => u.role === 'business').length;

  const stats = {
    totalVisits: Math.max(combinedUsers.length * 2 + matches.length, 1),
    uniqueVisitors: Math.max(combinedUsers.length, 1),
    totalUsers: combinedUsers.length,
    freelancers: freelancersCount,
    businesses: businessesCount,
    matchesMade: matches.length,
  };

  // 2. Dynamically calculate Services Freelancers are Offering
  const servicesOffered = useMemo(() => {
    const counts: Record<string, number> = {};
    let totalCount = 0;

    // From registered freelancers
    combinedUsers
      .filter((u) => u.role === 'freelancer')
      .forEach((u) => {
        if (Array.isArray(u.skills) && u.skills.length > 0) {
          u.skills.forEach((skill) => {
            const trimmed = skill.trim();
            if (trimmed) {
              counts[trimmed] = (counts[trimmed] || 0) + 1;
              totalCount++;
            }
          });
        }
        if (u.category && (!u.skills || u.skills.length === 0)) {
          counts[u.category] = (counts[u.category] || 0) + 1;
          totalCount++;
        }
      });

    // From talent candidate cards
    const allCandidateItems = [...candidates, ...firestoreGigs.filter((g) => g.type === 'candidate')];
    allCandidateItems.forEach((c) => {
      if (Array.isArray(c.tags) && c.tags.length > 0) {
        c.tags.forEach((tag) => {
          const trimmed = tag.trim();
          if (trimmed) {
            counts[trimmed] = (counts[trimmed] || 0) + 1;
            totalCount++;
          }
        });
      }
      if (c.category && (!c.tags || c.tags.length === 0)) {
        counts[c.category] = (counts[c.category] || 0) + 1;
        totalCount++;
      }
    });

    if (totalCount === 0) {
      return [];
    }

    const items = Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percent: Math.round((count / totalCount) * 100),
    }));

    // Sort descending by count, then by percentage
    items.sort((a, b) => b.count - a.count || b.percent - a.percent);

    // Ensure rounding adds up cleanly to 100%
    const currentSum = items.reduce((acc, curr) => acc + curr.percent, 0);
    if (items.length > 0 && currentSum !== 100 && currentSum > 0) {
      items[0].percent += 100 - currentSum;
    }

    return items;
  }, [combinedUsers, candidates, firestoreGigs]);

  // 3. Dynamically calculate Services Businesses Want
  const servicesWanted = useMemo(() => {
    const counts: Record<string, number> = {};
    let totalCount = 0;

    // From registered businesses
    combinedUsers
      .filter((u) => u.role === 'business')
      .forEach((u) => {
        if (Array.isArray(u.skills) && u.skills.length > 0) {
          u.skills.forEach((skill) => {
            const trimmed = skill.trim();
            if (trimmed) {
              counts[trimmed] = (counts[trimmed] || 0) + 1;
              totalCount++;
            }
          });
        }
        if (u.category && (!u.skills || u.skills.length === 0)) {
          counts[u.category] = (counts[u.category] || 0) + 1;
          totalCount++;
        }
      });

    // From job postings
    const allJobItems = [...jobs, ...firestoreGigs.filter((g) => g.type === 'job')];
    allJobItems.forEach((j) => {
      if (Array.isArray(j.tags) && j.tags.length > 0) {
        j.tags.forEach((tag) => {
          const trimmed = tag.trim();
          if (trimmed) {
            counts[trimmed] = (counts[trimmed] || 0) + 1;
            totalCount++;
          }
        });
      }
      if (j.category && (!j.tags || j.tags.length === 0)) {
        counts[j.category] = (counts[j.category] || 0) + 1;
        totalCount++;
      }
    });

    if (totalCount === 0) {
      return [];
    }

    const items = Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percent: Math.round((count / totalCount) * 100),
    }));

    // Sort descending by count, then by percentage
    items.sort((a, b) => b.count - a.count || b.percent - a.percent);

    // Ensure rounding adds up cleanly to 100%
    const currentSum = items.reduce((acc, curr) => acc + curr.percent, 0);
    if (items.length > 0 && currentSum !== 100 && currentSum > 0) {
      items[0].percent += 100 - currentSum;
    }

    return items;
  }, [combinedUsers, jobs, firestoreGigs]);

  // Registered users table list
  const registeredUsers = useMemo(() => {
    return combinedUsers.map((u) => ({
      name: u.name || 'Member',
      email: u.email || 'No email',
      role: u.role || 'freelancer',
      rateOrBudget: u.rateOrBudget || 'Standard',
      provider: u.verified ? 'Verified Account' : 'Active Account',
      joined: 'Active user',
    }));
  }, [combinedUsers]);

  const filteredUsers = registeredUsers.filter(
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
            title="Back to login"
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
          Back to Login
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
            {servicesOffered.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-3">
                <div className="w-8 h-8 rounded-full bg-[#FFF9E6] border border-black flex items-center justify-center mb-1.5">
                  <Briefcase className="w-4 h-4 text-black" />
                </div>
                <div className="font-extrabold text-[12px] text-black">No freelancer services yet</div>
                <p className="text-[11px] font-medium text-[#6E6E6E] mt-0.5 max-w-[200px]">
                  Real-time figures will calculate as freelancers set up their profiles.
                </p>
              </div>
            ) : (
              servicesOffered.map((item) => (
                <div key={item.name}>
                  <div className="flex justify-between text-[12px] font-bold text-black mb-1">
                    <span className="truncate pr-2">{item.name}</span>
                    <span className="text-[#6E6E6E] font-extrabold flex-shrink-0">
                      {item.count > 1 ? `${item.count} · ` : ''}{item.percent}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-[#FFFCF5] border border-black rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#FFC629] border-r border-black"
                      style={{ width: `${Math.min(item.percent, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
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
            {servicesWanted.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-3">
                <div className="w-8 h-8 rounded-full bg-[#FFFCF5] border border-black flex items-center justify-center mb-1.5">
                  <Users className="w-4 h-4 text-black" />
                </div>
                <div className="font-extrabold text-[12px] text-black">No business requests yet</div>
                <p className="text-[11px] font-medium text-[#6E6E6E] mt-0.5 max-w-[200px]">
                  Real-time figures will calculate as businesses set up their profiles.
                </p>
              </div>
            ) : (
              servicesWanted.map((item) => (
                <div key={item.name}>
                  <div className="flex justify-between text-[12px] font-bold text-black mb-1">
                    <span className="truncate pr-2">{item.name}</span>
                    <span className="text-[#6E6E6E] font-extrabold flex-shrink-0">
                      {item.count > 1 ? `${item.count} · ` : ''}{item.percent}%
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-[#FFFCF5] border border-black rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black"
                      style={{ width: `${Math.min(item.percent, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
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
