import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserProfile, isAdminEmail } from '../types';
import { Check, Edit3, ShieldCheck, Star, LogOut, Mail, Tag, Shield } from 'lucide-react';
import { CurrencyDropdown } from './CurrencyDropdown';
import { CurrencyInfo, formatWithCurrency, updateInputWithCurrency } from '../lib/currency';

interface ProfileScreenProps {
  profile: UserProfile;
  currentCurrency?: string;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onLogout?: () => void;
  onOpenAdmin?: () => void;
  onCurrencyChange?: (curr: CurrencyInfo) => void;
}

export function ProfileScreen({
  profile,
  currentCurrency = '$',
  onUpdateProfile,
  onLogout,
  onOpenAdmin,
  onCurrencyChange,
}: ProfileScreenProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<string>(() => {
    try {
      return localStorage.getItem('gigly_currency') || currentCurrency || '$';
    } catch {
      return currentCurrency || '$';
    }
  });

  // Form states
  const [name, setName] = useState(profile.name || '');
  const [roleTitle, setRoleTitle] = useState(profile.roleTitle || '');
  const [rateOrBudget, setRateOrBudget] = useState(profile.rateOrBudget || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [skillsStr, setSkillsStr] = useState((profile.skills || []).join(', '));

  React.useEffect(() => {
    setName(profile.name || '');
    setRoleTitle(profile.roleTitle || '');
    setRateOrBudget(profile.rateOrBudget || '');
    setBio(profile.bio || '');
    setSkillsStr((profile.skills || []).join(', '));
  }, [profile]);

  const handleCurrencyChange = (curr: CurrencyInfo) => {
    setSelectedCurrency(curr.symbol);
    try {
      localStorage.setItem('gigly_currency', curr.symbol);
    } catch {}
    if (onCurrencyChange) {
      onCurrencyChange(curr);
    }
    const updatedRate = updateInputWithCurrency(rateOrBudget, curr.symbol, profile.role);
    setRateOrBudget(updatedRate);
    if (!isEditing) {
      onUpdateProfile({
        rateOrBudget: formatWithCurrency(profile.rateOrBudget, curr.symbol),
      });
    }
  };

  const handleSave = () => {
    const updatedSkills = skillsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    onUpdateProfile({
      name,
      roleTitle,
      rateOrBudget,
      bio,
      skills: updatedSkills,
      avatarInitials: name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'YS',
    });
    setIsEditing(false);
  };

  return (
    <div className="w-full flex flex-col pb-8">
      <header className="w-full mb-4">
        <div className="font-display font-[800] text-[26px] text-black tracking-tight flex items-center gap-1.5 mb-2">
          Gigly <span className="w-2.5 h-2.5 rounded-full bg-[#FFC629] border-[2px] border-black inline-block" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-[800] text-[24px] text-black">Your profile</h2>
            <p className="text-[13px] font-semibold text-[#6E6E6E]">
              {profile.role === 'freelancer'
                ? 'This is what clients see when you match.'
                : 'This is what freelancers see when you match.'}
            </p>
          </div>
          <div className="px-3 py-1.5 bg-[#FFF9E6] border-2 border-black rounded-full text-[11px] font-extrabold text-black shadow-[2px_2px_0px_0px_#000] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#0D6832]" />
            <span className="capitalize">{profile.role === 'freelancer' ? 'Freelancer' : 'Business'}</span>
          </div>
        </div>
      </header>

      {/* Main Profile Card */}
      <div className="bg-white border-[3px] border-black rounded-[26px] p-6 shadow-[8px_10px_0px_0px_#000]">
        {/* Head */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-full bg-[#FFC629] border-[3px] border-black flex items-center justify-center font-display font-[800] text-[22px] text-black flex-shrink-0 shadow-[2px_2px_0px_0px_#000]">
            {profile.avatarInitials}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-[800] text-[20px] text-black truncate">
              {profile.name}
            </h3>
            <p className="text-[13px] font-semibold text-[#6E6E6E] truncate">
              {profile.roleTitle}
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 mt-1.5 rounded-full bg-[#FFC629] border-[1.5px] border-black text-[10.5px] font-extrabold text-black">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{profile.role === 'freelancer' ? 'ID verified' : 'Company verified'}</span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 py-4 my-2 border-y-2 border-dashed border-black/15 text-center">
          <div>
            <div className="font-display font-[800] text-[20px] text-black">
              {profile.stats.appliedOrPosted}
            </div>
            <div className="text-[10.5px] font-semibold text-[#6E6E6E]">
              {profile.role === 'freelancer' ? 'Applied' : 'Jobs Posted'}
            </div>
          </div>
          <div>
            <div className="font-display font-[800] text-[20px] text-black">
              {profile.stats.hired}
            </div>
            <div className="text-[10.5px] font-semibold text-[#6E6E6E]">Hired</div>
          </div>
          <div>
            <div className="font-display font-[800] text-[20px] text-black">
              {profile.stats.ratingOrResponse}
            </div>
            <div className="text-[10.5px] font-semibold text-[#6E6E6E]">
              {profile.role === 'freelancer' ? 'Response' : 'Rating'}
            </div>
          </div>
        </div>

        {/* View Mode Fields */}
        {!isEditing ? (
          <div className="space-y-4 pt-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="block text-[11px] font-bold uppercase tracking-wider text-[#6E6E6E]">
                  {profile.role === 'freelancer' ? 'Rate' : 'Typical Budget'}
                </span>
                <CurrencyDropdown
                  value={selectedCurrency}
                  onChange={handleCurrencyChange}
                  size="xs"
                />
              </div>
              <p className="text-[14px] font-semibold text-black">
                {formatWithCurrency(profile.rateOrBudget, selectedCurrency)}
              </p>
            </div>

            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#6E6E6E] mb-1">
                About
              </span>
              <p className="text-[13.5px] font-normal text-[#3A3A3A] leading-relaxed">
                {profile.bio}
              </p>
            </div>

            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-[#6E6E6E] mb-1.5">
                {profile.role === 'freelancer' ? 'Skills' : 'Hiring for'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((s) => (
                  <span
                    key={s}
                    className="px-2.5 py-1 bg-[#FFFCF5] border-[1.5px] border-black rounded-full text-[11px] font-bold text-black"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              className="w-full mt-4 py-3 bg-black text-[#FFC629] font-display font-[800] text-[13.5px] rounded-full border-[2px] border-black cursor-pointer shadow-[3px_3px_0px_0px_#000] hover:translate-y-[-1px] flex items-center justify-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit profile</span>
            </button>
          </div>
        ) : (
          /* Edit Mode Fields */
          <div className="space-y-3 pt-2">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6E6E6E] mb-1">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#FFFCF5] border-[2px] border-black rounded-xl text-[13.5px] font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFC629]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6E6E6E] mb-1">
                {profile.role === 'freelancer' ? 'Role' : 'Industry / Team size'}
              </label>
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#FFFCF5] border-[2px] border-black rounded-xl text-[13.5px] font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFC629]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6E6E6E]">
                  {profile.role === 'freelancer' ? 'Rate' : 'Typical Budget'}
                </label>
                <CurrencyDropdown
                  value={selectedCurrency}
                  onChange={handleCurrencyChange}
                  size="xs"
                />
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={rateOrBudget}
                  onChange={(e) => setRateOrBudget(e.target.value)}
                  placeholder={`${selectedCurrency}60 / hr`}
                  className="w-full pl-10 pr-3.5 py-2 bg-[#FFFCF5] border-[2px] border-black rounded-xl text-[13.5px] font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFC629]"
                />
                <div className="absolute left-3 top-2.5 font-display font-[800] text-[13.5px] text-black w-5 text-center select-none pointer-events-none">
                  {selectedCurrency}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6E6E6E] mb-1">
                About
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#FFFCF5] border-[2px] border-black rounded-xl text-[13.5px] font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFC629]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6E6E6E] mb-1">
                {profile.role === 'freelancer' ? 'Skills (comma separated)' : 'Hiring for (comma separated)'}
              </label>
              <input
                type="text"
                value={skillsStr}
                onChange={(e) => setSkillsStr(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#FFFCF5] border-[2px] border-black rounded-xl text-[13.5px] font-semibold focus:outline-none focus:ring-2 focus:ring-[#FFC629]"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2.5 bg-white text-black font-display font-bold text-[13px] rounded-full border-[2px] border-black cursor-pointer shadow-[2px_2px_0px_0px_#000]"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 bg-[#FFC629] text-black font-display font-bold text-[13px] rounded-full border-[2px] border-black cursor-pointer shadow-[2px_2px_0px_0px_#000] flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Save profile</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Admin Access Quick Switch */}
      {isAdminEmail(profile.email) && onOpenAdmin && (
        <div className="mt-4 p-4 bg-[#FFF9E6] border-[2.5px] border-black rounded-[20px] shadow-[4px_4px_0px_0px_#000] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#FFC629] border border-black flex items-center justify-center">
              <Shield className="w-4 h-4 text-black stroke-[2.5]" />
            </div>
            <div>
              <div className="font-display font-[800] text-[13.5px] text-black">Administrator Portal</div>
              <div className="text-[11px] font-semibold text-[#666]">Platform metrics & live users</div>
            </div>
          </div>
          <button
            onClick={onOpenAdmin}
            className="px-3.5 py-1.5 bg-black text-[#FFC629] font-display font-bold text-[12px] rounded-xl hover:bg-[#222] transition-colors cursor-pointer border border-black shadow-[2px_2px_0px_0px_#000]"
          >
            Open &rarr;
          </button>
        </div>
      )}

      {/* Account Info & Sign Out */}
      <div className="mt-4 p-4 bg-white border-[2.5px] border-black rounded-[20px] shadow-[3px_4px_0px_0px_#000] flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#FFF9E6] border border-black flex items-center justify-center flex-shrink-0">
            <Mail className="w-4 h-4 text-black" />
          </div>
          <div className="min-w-0">
            <div className="text-[10.5px] font-extrabold uppercase text-[#6E6E6E] leading-none">
              Signed in as
            </div>
            <div className="text-[13px] font-bold text-black truncate max-w-[190px]">
              {profile.email || 'Connected Account'}
            </div>
          </div>
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="py-1.5 px-3 bg-[#FFEBEA] border-[1.5px] border-[#D93025] rounded-full text-[11.5px] font-bold text-[#D93025] flex items-center gap-1 hover:bg-[#D93025] hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        )}
      </div>
    </div>
  );
}
