'use client';

import React, { useState, useRef } from 'react';
import { Zap, User, Upload, Plus, X } from 'lucide-react';

/**
 * Review interface
 */
interface Review {
  id: string;
  username: string;
  image: string;
  note: string;
  enabled: boolean;
}

/**
 * Shop Vibe configuration
 */
interface VibeConfig {
  spotlight: {
    enabled: boolean;
    title: string;
    subtitle: string;
    color: string;
  };
  makerBio: {
    enabled: boolean;
    name: string;
    role: string;
    bio: string;
    imageUrl: string;
  };
  reviews: Review[];
}

const MOCK_ARCHIVED_STORIES = [
  {
    id: 's1',
    url: 'https://images.unsplash.com/photo-1512413914633-b5043f4041ea?w=400&q=80',
    date: '2h ago',
  },
  {
    id: 's2',
    url: 'https://images.unsplash.com/photo-1528913753736-2313fa43cb8d?w=400&q=80',
    date: '5h ago',
  },
  {
    id: 's3',
    url: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=80',
    date: '1d ago',
  },
  {
    id: 's4',
    url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&q=80',
    date: '2d ago',
  },
];

/**
 * Seller Shop Vibe Page
 *
 * Customize shop appearance with spotlight offers, maker bio, and reviews.
 */
export default function VibePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSelectingStory, setIsSelectingStory] = useState(false);

  const [config, setConfig] = useState<VibeConfig>({
    spotlight: {
      enabled: false,
      title: 'Winter Sale',
      subtitle: 'Up to 50% Off',
      color: 'from-orange-500 to-red-600',
    },
    makerBio: {
      enabled: true,
      name: 'Fatima',
      role: 'Artisan',
      bio: 'Creating traditional Moroccan crafts for over 20 years.',
      imageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80',
    },
    reviews: [
      {
        id: 'r1',
        username: 'sarah_style',
        image: 'https://images.unsplash.com/photo-1512413914633-b5043f4041ea?w=400&q=80',
        note: 'Amazing quality! ❤️',
        enabled: true,
      },
    ],
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      setConfig((prev) => ({
        ...prev,
        makerBio: { ...prev.makerBio, imageUrl },
      }));
    }
  };

  const handleSelectStory = (storyUrl: string) => {
    const newReview: Review = {
      id: `story-${Date.now()}`,
      username: 'customer_love',
      image: storyUrl,
      note: 'Customer Love ❤️',
      enabled: true,
    };
    setConfig((prev) => ({ ...prev, reviews: [...prev.reviews, newReview] }));
    setIsSelectingStory(false);
  };

  const handleSave = () => {
    // TODO: Save to API
    console.log('Saving vibe config:', config);
  };

  return (
    <div className="animate-fade-in pb-24 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">Shop Vibe</h2>
        <button
          onClick={handleSave}
          className="text-xs font-bold text-emerald-400 hover:text-emerald-300"
        >
          Save Changes
        </button>
      </div>

      {/* Spotlight / Offers */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center text-orange-500">
              <Zap size={20} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Spotlight Offer</h3>
              <p className="text-[10px] text-zinc-500">Featured card on profile</p>
            </div>
          </div>
          <button
            onClick={() =>
              setConfig((prev) => ({
                ...prev,
                spotlight: { ...prev.spotlight, enabled: !prev.spotlight.enabled },
              }))
            }
            className={`w-10 h-6 rounded-full transition-colors relative ${
              config.spotlight.enabled ? 'bg-emerald-500' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                config.spotlight.enabled ? 'left-5' : 'left-1'
              }`}
            />
          </button>
        </div>
        {config.spotlight.enabled && (
          <div className="space-y-2">
            <input
              type="text"
              value={config.spotlight.title}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  spotlight: { ...prev.spotlight, title: e.target.value },
                }))
              }
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              placeholder="Title (e.g. Winter Sale)"
            />
            <input
              type="text"
              value={config.spotlight.subtitle}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  spotlight: { ...prev.spotlight, subtitle: e.target.value },
                }))
              }
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"
              placeholder="Subtitle (e.g. Up to 50% Off)"
            />
          </div>
        )}
      </div>

      {/* Maker Bio */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center">
              <User size={20} className="text-zinc-400" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Maker Profile</h3>
              <p className="text-[10px] text-zinc-500">Personalize your shop</p>
            </div>
          </div>
          <button
            onClick={() =>
              setConfig((prev) => ({
                ...prev,
                makerBio: { ...prev.makerBio, enabled: !prev.makerBio.enabled },
              }))
            }
            className={`w-10 h-6 rounded-full transition-colors relative ${
              config.makerBio.enabled ? 'bg-emerald-500' : 'bg-zinc-700'
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                config.makerBio.enabled ? 'left-5' : 'left-1'
              }`}
            />
          </button>
        </div>

        {config.makerBio.enabled && (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-full bg-black border border-zinc-800 overflow-hidden group">
                <img
                  src={config.makerBio.imageUrl}
                  className="w-full h-full object-cover"
                  alt="Maker"
                />
                <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <Upload size={16} className="text-white" />
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
              </div>
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  placeholder="Name"
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  value={config.makerBio.name}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      makerBio: { ...prev.makerBio, name: e.target.value },
                    }))
                  }
                />
                <input
                  type="text"
                  placeholder="Role (e.g. Artisan)"
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                  value={config.makerBio.role}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      makerBio: { ...prev.makerBio, role: e.target.value },
                    }))
                  }
                />
              </div>
            </div>
            <textarea
              rows={2}
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none resize-none"
              placeholder="Short bio..."
              value={config.makerBio.bio}
              onChange={(e) =>
                setConfig((prev) => ({
                  ...prev,
                  makerBio: { ...prev.makerBio, bio: e.target.value },
                }))
              }
            />
          </div>
        )}
      </div>

      {/* Reviews / Stories Selector */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-sm text-white">Pinned Reviews</h3>
            <p className="text-[10px] text-zinc-500">Showcase customer love from Stories</p>
          </div>
          <button
            onClick={() => setIsSelectingStory(!isSelectingStory)}
            className="bg-zinc-800 hover:bg-zinc-700 text-white p-2 rounded-lg"
          >
            {isSelectingStory ? <X size={16} /> : <Plus size={16} />}
          </button>
        </div>

        {isSelectingStory && (
          <div className="grid grid-cols-4 gap-2 mb-4 animate-slide-down">
            {MOCK_ARCHIVED_STORIES.map((story) => (
              <button
                key={story.id}
                onClick={() => handleSelectStory(story.url)}
                className="aspect-[9/16] rounded-lg overflow-hidden border border-zinc-800 hover:border-emerald-500 transition-colors relative"
              >
                <img src={story.url} className="w-full h-full object-cover" alt="Story" />
                <div className="absolute inset-0 bg-black/20" />
              </button>
            ))}
          </div>
        )}

        <div className="space-y-2">
          {config.reviews.map((review) => (
            <div
              key={review.id}
              className="flex items-center gap-3 bg-black p-2 rounded-xl border border-zinc-800"
            >
              <img
                src={review.image}
                className="w-8 h-12 rounded bg-zinc-800 object-cover"
                alt="Review"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">@{review.username}</p>
                <input
                  type="text"
                  value={review.note}
                  onChange={(e) => {
                    const newReviews = config.reviews.map((r) =>
                      r.id === review.id ? { ...r, note: e.target.value } : r
                    );
                    setConfig((prev) => ({ ...prev, reviews: newReviews }));
                  }}
                  className="w-full bg-transparent text-[10px] text-zinc-400 focus:text-white focus:outline-none mt-0.5"
                  placeholder="Add note..."
                />
              </div>
              <button
                onClick={() => {
                  const newReviews = config.reviews.filter((r) => r.id !== review.id);
                  setConfig((prev) => ({ ...prev, reviews: newReviews }));
                }}
                className="p-2 text-zinc-600 hover:text-red-400"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
