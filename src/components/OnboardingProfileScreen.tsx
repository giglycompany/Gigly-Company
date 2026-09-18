import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  User,
  Briefcase,
  DollarSign,
  Tag,
  FileText,
  Check,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { GigCategory, GIG_CATEGORIES, UserProfile } from '../types';
import { GiglyLogo } from './GiglyLogo';

interface OnboardingProfileScreenProps {
  userEmail: string;
  initialName?: string;
  onSaveProfile: (profile: UserProfile) => Promise<void> | void;
}

const POPULAR_SKILLS = [
  'React',
  'Figma',
  'Design systems',
  'Node.js',
  'Copywriting',
  'Social Media',
  'Video Editing',
  'Next.js',
  'UI/UX',
  'SEO',
  'Branding',
  'TypeScript',
];

export function OnboardingProfileScreen({
  userEmail,
  initialName = '',
  onSaveProfile,
}: OnboardingProfileScreenProps) {
  const [role, setRole] = useState<'freelancer' | 'business'>('freelancer');
  const [name, setName] = useState(initialName || (userEmail ? userEmail.split('@')[0] : ''));
  const [category, setCategory] = useState<GigCategory>('Designer');
  const [roleTitle, setRoleTitle] = useState(
    role === 'freelancer' ? 'Product & UI/UX Designer' : 'Design & Tech Studio'
  );
  const [rateOrBudget, setRateOrBudget] = useState(
    role === 'freelancer' ? '$55–75 / hr' : '$1,000–3,000 / project'
  );
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState<string[]>(['Figma', 'UI/UX']);
  const [customSkill, setCustomSkill] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // When switching role, adjust default title and rate placeholder if user hasn't heavily customized
  const handleRoleChange = (newRole: 'freelancer' | 'business') => {
    setRole(newRole);
    if (newRole === 'freelancer') {
      setRoleTitle('Product & UI/UX Designer');
      setRateOrBudget('$55–75 / hr');
    } else {
      setRoleTitle('Design & Tech Studio');
      setRateOrBudget('$1,000–3,000 / project');
    }
  };

  const toggleSkill = (skill: string) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter((s) => s !== skill));
    } else {
      setSkills([...skills, skill]);
    }
  };

  const handleAddCustomSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const trimmed = customSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setCustomSkill('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation - All info is mandatory for new accounts
    if (!name.trim()) {
      setError('Please enter your full or business name.');
      return;
    }
    if (!roleTitle.trim()) {
      setError('Please enter your professional headline / title.');
      return;
    }
    if (!rateOrBudget.trim()) {
      setError('Please provide your expected rate or project budget.');
      return;
    }
    if (!bio.trim() || bio.trim().length < 15) {
      setError('Please write a brief bio or description (at least 15 characters).');
      return;
    }
    if (skills.length === 0) {
      setError('Please select or add at least one skill or focus area.');
      return;
    }

    setIsSubmitting(true);

    const initials = name
      .trim()
      .split(' ')
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'GM';

    const newProfile: UserProfile = {
      name: name.trim(),
      role,
      roleTitle: roleTitle.trim(),
      rateOrBudget: rateOrBudget.trim(),
      category,
      bio: bio.trim(),
      skills,
      email: userEmail,
      avatarInitials: initials,
      verified: true,
      profileCompleted: true,
      stats: {
        appliedOrPosted: role === 'freelancer' ? 1 : 1,
        hired: 0,
        ratingOrResponse: '100%',
      },
    };

    try {
      await onSaveProfile(newProfile);
    } catch (err: any) {
      setError(err?.message || 'Failed to save profile. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] min-h-screen flex flex-col p-5 py-8 select-none">
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-4">
        <GiglyLogo size="md" />
        <div className="px-2.5 py-1 bg-[#FFF9E6] border border-black rounded-full text-[11px] font-bold text-black flex items-center gap-1.5 truncate max-w-[180px]">
          <span className="w-2 h-2 rounded-full bg-[#0D6832]" />
          <span className="truncate">{userEmail}</span>
        </div>
      </div>

      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFC629] border-[2px] border-black text-[11px] font-black uppercase tracking-wider mb-2 shadow-[2px_2px_0px_0px_#000]">
          <Sparkles className="w-3.5 h-3.5 fill-black" />
          Mandatory Profile Setup
        </div>
        <h2 className="font-display font-[900] text-[26px] text-black leading-tight">
          Create your profile
        </h2>
        <p className="text-[13px] font-semibold text-[#6E6E6E] mt-1">
          Welcome! Complete your profile to start matching. This will be visible to potential {role === 'freelancer' ? 'clients' : 'freelancers'}.
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-[#FFEBEA] border-2 border-[#D93025] rounded-xl flex items-center gap-2 text-[12.5px] font-bold text-[#D93025]"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* 1. Account Role Selection */}
        <div>
          <label className="block text-[12px] font-extrabold uppercase text-black mb-1.5">
            1. I am joining as a <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => handleRoleChange('freelancer')}
              className={`p-3.5 rounded-2xl border-[2.5px] text-left transition-all cursor-pointer ${
                role === 'freelancer'
                  ? 'bg-[#FFC629] border-black shadow-[3px_4px_0px_0px_#000] translate-y-[-1px]'
                  : 'bg-white border-black/30 hover:border-black opacity-80'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <User className="w-5 h-5 text-black" />
                {role === 'freelancer' && (
                  <span className="w-4 h-4 rounded-full bg-black text-[#FFC629] flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                )}
              </div>
              <div className="font-display font-extrabold text-[14px] text-black">
                Freelancer
              </div>
              <div className="text-[11px] font-semibold text-[#4A4A4A] leading-tight">
                Find gigs & get hired
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange('business')}
              className={`p-3.5 rounded-2xl border-[2.5px] text-left transition-all cursor-pointer ${
                role === 'business'
                  ? 'bg-[#FFC629] border-black shadow-[3px_4px_0px_0px_#000] translate-y-[-1px]'
                  : 'bg-white border-black/30 hover:border-black opacity-80'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Briefcase className="w-5 h-5 text-black" />
                {role === 'business' && (
                  <span className="w-4 h-4 rounded-full bg-black text-[#FFC629] flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                )}
              </div>
              <div className="font-display font-extrabold text-[14px] text-black">
                Business / Client
              </div>
              <div className="text-[11px] font-semibold text-[#4A4A4A] leading-tight">
                Hire talent & post jobs
              </div>
            </button>
          </div>
        </div>

        {/* 2. Full Name / Business Name */}
        <div>
          <label className="block text-[12px] font-extrabold uppercase text-black mb-1.5">
            2. {role === 'freelancer' ? 'Your Name' : 'Company or Agency Name'}{' '}
            <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={role === 'freelancer' ? 'e.g. Alex Rivera' : 'e.g. Acme Media Labs'}
            className="w-full px-4 py-3 bg-white border-[2.5px] border-black rounded-xl text-[14px] font-semibold text-black focus:outline-none focus:ring-2 focus:ring-[#FFC629] shadow-[2px_2px_0px_0px_#000]"
          />
        </div>

        {/* 3. Role Title / Headline */}
        <div>
          <label className="block text-[12px] font-extrabold uppercase text-black mb-1.5">
            3. Professional Headline / Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            placeholder={
              role === 'freelancer'
                ? 'e.g. Full-Stack Web & Mobile Engineer'
                : 'e.g. Growth Marketing & Creative Studio'
            }
            className="w-full px-4 py-3 bg-white border-[2.5px] border-black rounded-xl text-[14px] font-semibold text-black focus:outline-none focus:ring-2 focus:ring-[#FFC629] shadow-[2px_2px_0px_0px_#000]"
          />
        </div>

        {/* 4. Category Selection */}
        <div>
          <label className="block text-[12px] font-extrabold uppercase text-black mb-1.5">
            4. Primary Domain / Category <span className="text-red-500">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as GigCategory)}
            className="w-full px-4 py-3 bg-white border-[2.5px] border-black rounded-xl text-[14px] font-semibold text-black focus:outline-none focus:ring-2 focus:ring-[#FFC629] shadow-[2px_2px_0px_0px_#000] cursor-pointer"
          >
            {GIG_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* 5. Rate / Budget */}
        <div>
          <label className="block text-[12px] font-extrabold uppercase text-black mb-1.5">
            5. {role === 'freelancer' ? 'Hourly / Project Rate' : 'Typical Project Budget'}{' '}
            <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={rateOrBudget}
              onChange={(e) => setRateOrBudget(e.target.value)}
              placeholder={role === 'freelancer' ? '$60 / hr' : '$1,500–5,000 / project'}
              className="w-full pl-10 pr-4 py-3 bg-white border-[2.5px] border-black rounded-xl text-[14px] font-semibold text-black focus:outline-none focus:ring-2 focus:ring-[#FFC629] shadow-[2px_2px_0px_0px_#000]"
            />
            <DollarSign className="w-5 h-5 text-black absolute left-3 top-3.5" />
          </div>
        </div>

        {/* 6. Bio / Description */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-[12px] font-extrabold uppercase text-black">
              6. Bio & Experience <span className="text-red-500">*</span>
            </label>
            <span className="text-[11px] font-bold text-[#6E6E6E]">
              {bio.length} chars (min 15)
            </span>
          </div>
          <textarea
            required
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={
              role === 'freelancer'
                ? 'Tell clients what you specialize in, notable projects you have shipped, and what makes your work exceptional...'
                : 'Describe your company, what projects you are hiring for, and what you value in collaborators...'
            }
            className="w-full px-4 py-3 bg-white border-[2.5px] border-black rounded-xl text-[13.5px] font-medium text-black focus:outline-none focus:ring-2 focus:ring-[#FFC629] shadow-[2px_2px_0px_0px_#000] resize-none"
          />
        </div>

        {/* 7. Skills & Tags */}
        <div>
          <label className="block text-[12px] font-extrabold uppercase text-black mb-1.5">
            7. Skills & Focus Tags <span className="text-red-500">*</span>
          </label>

          {/* Quick toggle chips */}
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {POPULAR_SKILLS.map((sk) => {
              const isSelected = skills.includes(sk);
              return (
                <button
                  type="button"
                  key={sk}
                  onClick={() => toggleSkill(sk)}
                  className={`px-2.5 py-1 rounded-lg text-[11.5px] font-extrabold border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#FFC629] text-black border-black shadow-[1.5px_1.5px_0px_0px_#000]'
                      : 'bg-white text-[#4A4A4A] border-gray-300 hover:border-black'
                  }`}
                >
                  {isSelected ? `✓ ${sk}` : `+ ${sk}`}
                </button>
              );
            })}
          </div>

          {/* Add custom skill input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value)}
              onKeyDown={handleAddCustomSkill}
              placeholder="Add other skill (e.g. Tailwind, Docker)..."
              className="flex-1 px-3.5 py-2 bg-white border-[2px] border-black rounded-xl text-[12.5px] font-semibold text-black focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddCustomSkill}
              className="px-3.5 py-2 bg-black text-[#FFC629] font-bold text-[12px] rounded-xl border-2 border-black cursor-pointer shadow-[2px_2px_0px_0px_#000]"
            >
              Add
            </button>
          </div>

          {/* Selected skills preview */}
          {skills.length > 0 && (
            <div className="mt-2 text-[11.5px] font-semibold text-[#6E6E6E]">
              Selected: <span className="text-black font-extrabold">{skills.join(', ')}</span>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="mt-4 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 bg-[#FFC629] text-black font-display font-[900] text-[16px] rounded-2xl border-[3px] border-black shadow-[4px_5px_0px_0px_#000] hover:translate-y-[-1px] active:translate-y-[1px] cursor-pointer flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Saving your profile to account...</span>
            ) : (
              <>
                <span>Save Profile & Start Exploring</span>
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </>
            )}
          </button>
          <div className="text-center text-[11px] font-bold text-[#6E6E6E] mt-2 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0D6832]" />
            <span>Saved permanently to your account for future logins</span>
          </div>
        </div>
      </form>
    </div>
  );
}
