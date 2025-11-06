'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export interface BusinessInfo {
  businessName: string;
  industry: string;
  email: string;
  brandColor?: string;
  logo?: File;
  // Industry-specific fields
  industrySpecific?: {
    serviceTypes?: string[];
    emergencyService?: boolean;
    beforeAfterPhotos?: boolean;
    seasonalServices?: string[];
    installationTimeline?: string;
    energyRatings?: boolean;
    maintenancePlans?: boolean;
  };
}

interface BusinessInfoFormProps {
  onSubmit: (data: BusinessInfo) => void;
}

const industries = [
  { value: 'hvac', label: 'HVAC' },
  { value: 'windows-doors', label: 'Windows & Doors' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'roofing', label: 'Roofing' },
  { value: 'painting', label: 'Painting' },
  { value: 'general-contractor', label: 'General Contractor' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'flooring', label: 'Flooring' },
  { value: 'other', label: 'Other' },
];

export default function BusinessInfoForm({ onSubmit }: BusinessInfoFormProps) {
  const [formData, setFormData] = useState<BusinessInfo>({
    businessName: '',
    industry: '',
    email: '',
    industrySpecific: {},
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate processing
    setTimeout(() => {
      onSubmit(formData);
    }, 1500);
  };

  const renderIndustrySpecificFields = () => {
    switch (formData.industry) {
      case 'hvac':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 rounded-lg bg-blue-50 p-4"
          >
            <h4 className="font-semibold text-primary">HVAC Specific Options</h4>

            <div>
              <label className="mb-2 block text-sm font-medium text-text-dark">
                Service Types (select all that apply)
              </label>
              <div className="space-y-2">
                {['Installation', 'Repair', 'Maintenance', 'Emergency'].map((type) => (
                  <label key={type} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={formData.industrySpecific?.serviceTypes?.includes(type)}
                      onChange={(e) => {
                        const currentTypes = formData.industrySpecific?.serviceTypes || [];
                        setFormData({
                          ...formData,
                          industrySpecific: {
                            ...formData.industrySpecific,
                            serviceTypes: e.target.checked
                              ? [...currentTypes, type]
                              : currentTypes.filter((t) => t !== type),
                          },
                        });
                      }}
                    />
                    <span className="text-sm text-text-dark">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={formData.industrySpecific?.emergencyService || false}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    industrySpecific: {
                      ...formData.industrySpecific,
                      emergencyService: e.target.checked,
                    },
                  })
                }
              />
              <span className="text-sm text-text-dark">Offer 24/7 Emergency Service</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={formData.industrySpecific?.beforeAfterPhotos || false}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    industrySpecific: {
                      ...formData.industrySpecific,
                      beforeAfterPhotos: e.target.checked,
                    },
                  })
                }
              />
              <span className="text-sm text-text-dark">Include Before/After Photos</span>
            </label>
          </motion.div>
        );

      case 'windows-doors':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 rounded-lg bg-amber-50 p-4"
          >
            <h4 className="font-semibold text-primary">Windows & Doors Options</h4>

            <div>
              <label className="mb-2 block text-sm font-medium text-text-dark">
                Typical Installation Timeline
              </label>
              <select
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={formData.industrySpecific?.installationTimeline || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    industrySpecific: {
                      ...formData.industrySpecific,
                      installationTimeline: e.target.value,
                    },
                  })
                }
              >
                <option value="">Select timeline...</option>
                <option value="same-day">Same Day</option>
                <option value="1-3-days">1-3 Days</option>
                <option value="1-week">1 Week</option>
                <option value="2-weeks">2+ Weeks</option>
              </select>
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={formData.industrySpecific?.energyRatings || false}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    industrySpecific: {
                      ...formData.industrySpecific,
                      energyRatings: e.target.checked,
                    },
                  })
                }
              />
              <span className="text-sm text-text-dark">Display Energy Efficiency Ratings</span>
            </label>
          </motion.div>
        );

      case 'landscaping':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 rounded-lg bg-green-50 p-4"
          >
            <h4 className="font-semibold text-primary">Landscaping Options</h4>

            <div>
              <label className="mb-2 block text-sm font-medium text-text-dark">
                Seasonal Services (select all that apply)
              </label>
              <div className="space-y-2">
                {['Spring Cleanup', 'Summer Maintenance', 'Fall Cleanup', 'Winter Snow Removal'].map((season) => (
                  <label key={season} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      checked={formData.industrySpecific?.seasonalServices?.includes(season)}
                      onChange={(e) => {
                        const currentSeasons = formData.industrySpecific?.seasonalServices || [];
                        setFormData({
                          ...formData,
                          industrySpecific: {
                            ...formData.industrySpecific,
                            seasonalServices: e.target.checked
                              ? [...currentSeasons, season]
                              : currentSeasons.filter((s) => s !== season),
                          },
                        });
                      }}
                    />
                    <span className="text-sm text-text-dark">{season}</span>
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={formData.industrySpecific?.maintenancePlans || false}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    industrySpecific: {
                      ...formData.industrySpecific,
                      maintenancePlans: e.target.checked,
                    },
                  })
                }
              />
              <span className="text-sm text-text-dark">Offer Maintenance Plans</span>
            </label>
          </motion.div>
        );

      case 'plumbing':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 rounded-lg bg-cyan-50 p-4"
          >
            <h4 className="font-semibold text-primary">Plumbing Options</h4>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={formData.industrySpecific?.emergencyService || false}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    industrySpecific: {
                      ...formData.industrySpecific,
                      emergencyService: e.target.checked,
                    },
                  })
                }
              />
              <span className="text-sm text-text-dark">24/7 Emergency Service Available</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                checked={formData.industrySpecific?.maintenancePlans || false}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    industrySpecific: {
                      ...formData.industrySpecific,
                      maintenancePlans: e.target.checked,
                    },
                  })
                }
              />
              <span className="text-sm text-text-dark">Annual Maintenance Plans</span>
            </label>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 text-center">
        <h2 className="mb-3 text-3xl font-bold text-text-dark">
          Tell Us About Your Business
        </h2>
        <p className="text-lg text-text-light">
          While our AI analyzes your preferences, let's gather some details
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business Name */}
        <div>
          <label className="mb-2 block text-sm font-medium text-text-dark">
            Business Name *
          </label>
          <input
            type="text"
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Parkway Group"
            value={formData.businessName}
            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
          />
        </div>

        {/* Industry */}
        <div>
          <label className="mb-2 block text-sm font-medium text-text-dark">
            Industry *
          </label>
          <select
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={formData.industry}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
          >
            <option value="">Select your industry...</option>
            {industries.map((ind) => (
              <option key={ind.value} value={ind.value}>
                {ind.label}
              </option>
            ))}
          </select>
        </div>

        {/* Industry-Specific Fields */}
        {formData.industry && renderIndustrySpecificFields()}

        {/* Email */}
        <div>
          <label className="mb-2 block text-sm font-medium text-text-dark">
            Email Address *
          </label>
          <input
            type="email"
            required
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="info@yourbusiness.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <p className="mt-1 text-xs text-text-light">
            We'll send your generated templates here
          </p>
        </div>

        {/* Optional Fields */}
        <div className="space-y-4 rounded-lg border-2 border-dashed border-gray-300 p-4">
          <p className="text-sm font-medium text-text-dark">
            Optional (helps personalize your templates)
          </p>

          <div>
            <label className="mb-2 block text-sm font-medium text-text-dark">
              Brand Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                className="h-12 w-24 cursor-pointer rounded border border-gray-300"
                value={formData.brandColor || '#3B82F6'}
                onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
              />
              <span className="text-sm text-text-light">
                {formData.brandColor || '#3B82F6'}
              </span>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-text-dark">
              Logo Upload
            </label>
            <input
              type="file"
              accept="image/*"
              className="w-full text-sm text-text-light file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-primary-dark"
              onChange={(e) =>
                setFormData({ ...formData, logo: e.target.files?.[0] })
              }
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-full bg-gradient-to-r from-primary to-accent px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                ⚙️
              </motion.span>
              Generating Templates...
            </span>
          ) : (
            'Generate My Templates'
          )}
        </button>
      </form>
    </div>
  );
}
