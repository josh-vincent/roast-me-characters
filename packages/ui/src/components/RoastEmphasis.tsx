import React, { useState } from 'react';
import { clsx } from 'clsx';

export interface RoastFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'facial' | 'expression' | 'body' | 'style';
  intensity?: 1 | 2 | 3 | 4 | 5; // 1 = subtle, 5 = extreme
}

export interface SelectedFeature extends RoastFeature {
  intensity: 1 | 2 | 3 | 4 | 5;
}

interface RoastEmphasisProps {
  selectedFeatures: SelectedFeature[];
  onFeaturesChange: (features: SelectedFeature[]) => void;
  maxSelections?: number;
  className?: string;
}

// Predefined funny roast features inspired by sketch/caricature art
const ROAST_FEATURES: RoastFeature[] = [
  // Facial Features
  {
    id: 'bug-eyes',
    name: 'Bug Eyes',
    description: 'Enormous, bulging eyes that pop out',
    icon: '👀',
    category: 'facial',
    intensity: 4
  },
  {
    id: 'cross-eyes',
    name: 'Cross Eyes',
    description: 'Eyes looking in different directions',
    icon: '😵‍💫',
    category: 'expression',
    intensity: 3
  },
  {
    id: 'rabbit-teeth',
    name: 'Rabbit Teeth',
    description: 'Giant front buck teeth',
    icon: '🐰',
    category: 'facial',
    intensity: 4
  },
  {
    id: 'crooked-nose',
    name: 'Crooked Nose',
    description: 'Wonky, bent nose',
    icon: '👃',
    category: 'facial',
    intensity: 3
  },
  {
    id: 'enormous-nose',
    name: 'Enormous Nose',
    description: 'Comically oversized schnoz',
    icon: '🔍',
    category: 'facial',
    intensity: 5
  },
  {
    id: 'tiny-mouth',
    name: 'Tiny Mouth',
    description: 'Itty-bitty little mouth',
    icon: '😗',
    category: 'facial',
    intensity: 3
  },
  {
    id: 'giant-grin',
    name: 'Giant Grin',
    description: 'Impossibly wide smile',
    icon: '😁',
    category: 'expression',
    intensity: 4
  },
  {
    id: 'dumbo-ears',
    name: 'Dumbo Ears',
    description: 'Massive floppy ears',
    icon: '👂',
    category: 'facial',
    intensity: 5
  },
  {
    id: 'unibrow',
    name: 'Unibrow',
    description: 'One giant connected eyebrow',
    icon: '😾',
    category: 'facial',
    intensity: 3
  },
  
  // Body Features
  {
    id: 'noodle-arms',
    name: 'Noodle Arms',
    description: 'Super thin, wiggly arms',
    icon: '🍜',
    category: 'body',
    intensity: 4
  },
  {
    id: 'chicken-legs',
    name: 'Chicken Legs',
    description: 'Scrawny, tiny legs',
    icon: '🐔',
    category: 'body',
    intensity: 3
  },
  {
    id: 'beer-belly',
    name: 'Beer Belly',
    description: 'Round, prominent gut',
    icon: '🍺',
    category: 'body',
    intensity: 4
  },
  {
    id: 'long-neck',
    name: 'Giraffe Neck',
    description: 'Impossibly long neck',
    icon: '🦒',
    category: 'body',
    intensity: 4
  },
  
  // Expression & Style
  {
    id: 'perpetual-frown',
    name: 'Perpetual Frown',
    description: 'Always grumpy expression',
    icon: '😠',
    category: 'expression',
    intensity: 3
  },
  {
    id: 'surprised-face',
    name: 'Surprised Face',
    description: 'Permanent shocked expression',
    icon: '😲',
    category: 'expression',
    intensity: 3
  },
  {
    id: 'sleepy-eyes',
    name: 'Sleepy Eyes',
    description: 'Half-closed, droopy eyes',
    icon: '😴',
    category: 'expression',
    intensity: 2
  },
  {
    id: 'crazy-hair',
    name: 'Crazy Hair',
    description: 'Wild, sticking-up hair',
    icon: '🤪',
    category: 'style',
    intensity: 4
  },
  {
    id: 'bald-dome',
    name: 'Shiny Dome',
    description: 'Completely bald and shiny',
    icon: '🥚',
    category: 'style',
    intensity: 3
  },
  {
    id: 'double-chin',
    name: 'Double Chin',
    description: 'Extra prominent chin action',
    icon: '🎭',
    category: 'facial',
    intensity: 3
  }
];

const CATEGORY_LABELS = {
  facial: '🎭 Facial',
  expression: '😤 Expression', 
  body: '🏃 Body',
  style: '✨ Style'
};

const INTENSITY_LABELS = {
  1: 'Subtle',
  2: 'Mild', 
  3: 'Noticeable',
  4: 'Extreme',
  5: 'Over-the-Top'
};

// Helper function to map AI-detected features to RoastEmphasis features
export function mapAIFeaturesToRoastFeatures(aiFeatures: any[]): SelectedFeature[] {
  const mappedFeatures: SelectedFeature[] = [];
  
  aiFeatures.forEach(aiFeature => {
    const featureName = aiFeature.feature_name.toLowerCase();
    let matchedFeature: RoastFeature | null = null;
    
    // Map AI features to predefined roast features based on keywords
    if (featureName.includes('eye') || featureName.includes('eyes')) {
      if (featureName.includes('big') || featureName.includes('large') || featureName.includes('bulge')) {
        matchedFeature = ROAST_FEATURES.find(f => f.id === 'bug-eyes') || null;
      } else if (featureName.includes('cross') || featureName.includes('different')) {
        matchedFeature = ROAST_FEATURES.find(f => f.id === 'cross-eyes') || null;
      } else if (featureName.includes('sleepy') || featureName.includes('droopy')) {
        matchedFeature = ROAST_FEATURES.find(f => f.id === 'sleepy-eyes') || null;
      }
    } else if (featureName.includes('nose')) {
      if (featureName.includes('big') || featureName.includes('large') || featureName.includes('enormous')) {
        matchedFeature = ROAST_FEATURES.find(f => f.id === 'enormous-nose') || null;
      } else if (featureName.includes('crooked') || featureName.includes('bent')) {
        matchedFeature = ROAST_FEATURES.find(f => f.id === 'crooked-nose') || null;
      }
    } else if (featureName.includes('teeth') || featureName.includes('tooth')) {
      if (featureName.includes('big') || featureName.includes('front') || featureName.includes('buck')) {
        matchedFeature = ROAST_FEATURES.find(f => f.id === 'rabbit-teeth') || null;
      }
    } else if (featureName.includes('mouth')) {
      if (featureName.includes('small') || featureName.includes('tiny')) {
        matchedFeature = ROAST_FEATURES.find(f => f.id === 'tiny-mouth') || null;
      } else if (featureName.includes('wide') || featureName.includes('big') || featureName.includes('smile')) {
        matchedFeature = ROAST_FEATURES.find(f => f.id === 'giant-grin') || null;
      }
    } else if (featureName.includes('ear')) {
      if (featureName.includes('big') || featureName.includes('large')) {
        matchedFeature = ROAST_FEATURES.find(f => f.id === 'dumbo-ears') || null;
      }
    } else if (featureName.includes('eyebrow') || featureName.includes('brow')) {
      matchedFeature = ROAST_FEATURES.find(f => f.id === 'unibrow') || null;
    } else if (featureName.includes('hair')) {
      if (featureName.includes('messy') || featureName.includes('wild') || featureName.includes('crazy')) {
        matchedFeature = ROAST_FEATURES.find(f => f.id === 'crazy-hair') || null;
      } else if (featureName.includes('bald') || featureName.includes('no hair')) {
        matchedFeature = ROAST_FEATURES.find(f => f.id === 'bald-dome') || null;
      }
    } else if (featureName.includes('chin')) {
      if (featureName.includes('double') || featureName.includes('big')) {
        matchedFeature = ROAST_FEATURES.find(f => f.id === 'double-chin') || null;
      }
    } else if (featureName.includes('neck')) {
      if (featureName.includes('long') || featureName.includes('tall')) {
        matchedFeature = ROAST_FEATURES.find(f => f.id === 'long-neck') || null;
      }
    } else if (featureName.includes('body') || featureName.includes('belly') || featureName.includes('stomach')) {
      if (featureName.includes('big') || featureName.includes('round')) {
        matchedFeature = ROAST_FEATURES.find(f => f.id === 'beer-belly') || null;
      }
    } else if (featureName.includes('arm')) {
      if (featureName.includes('thin') || featureName.includes('skinny')) {
        matchedFeature = ROAST_FEATURES.find(f => f.id === 'noodle-arms') || null;
      }
    } else if (featureName.includes('leg')) {
      if (featureName.includes('thin') || featureName.includes('skinny')) {
        matchedFeature = ROAST_FEATURES.find(f => f.id === 'chicken-legs') || null;
      }
    }
    
    // If we found a matching feature, add it with the AI's exaggeration factor
    if (matchedFeature) {
      // Map AI's 1-9 scale to our 1-5 intensity scale
      const intensity = Math.min(5, Math.max(1, Math.ceil((aiFeature.exaggeration_factor || 3) * 5 / 9))) as 1 | 2 | 3 | 4 | 5;
      mappedFeatures.push({
        ...matchedFeature,
        intensity
      });
    }
  });
  
  return mappedFeatures;
}

export function RoastEmphasis({ 
  selectedFeatures, 
  onFeaturesChange, 
  maxSelections = 4,
  className 
}: RoastEmphasisProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = ['all', ...Object.keys(CATEGORY_LABELS)] as const;
  const filteredFeatures = activeCategory === 'all' 
    ? ROAST_FEATURES 
    : ROAST_FEATURES.filter(f => f.category === activeCategory);

  const handleFeatureToggle = (feature: RoastFeature) => {
    const isSelected = selectedFeatures.find(f => f.id === feature.id);
    
    if (isSelected) {
      // Remove feature
      onFeaturesChange(selectedFeatures.filter(f => f.id !== feature.id));
    } else if (selectedFeatures.length < maxSelections) {
      // Add feature with default intensity
      const newFeature: SelectedFeature = {
        ...feature,
        intensity: feature.intensity || 3
      };
      onFeaturesChange([...selectedFeatures, newFeature]);
    }
  };

  const handleIntensityChange = (featureId: string, intensity: 1 | 2 | 3 | 4 | 5) => {
    onFeaturesChange(
      selectedFeatures.map(f => 
        f.id === featureId ? { ...f, intensity } : f
      )
    );
  };

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          🎨 Roast Emphasis
        </h3>
        <p className="text-sm text-gray-600">
          Select up to {maxSelections} funny features to emphasize in your character
        </p>
        <div className="text-xs text-gray-500 mt-1">
          Selected: {selectedFeatures.length}/{maxSelections}
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={clsx(
              'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
              activeCategory === category
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {category === 'all' ? '🎯 All' : CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
          </button>
        ))}
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredFeatures.map(feature => {
          const isSelected = selectedFeatures.find(f => f.id === feature.id);
          const isMaxed = selectedFeatures.length >= maxSelections && !isSelected;
          
          return (
            <div
              key={feature.id}
              className={clsx(
                'p-3 rounded-lg border-2 transition-all cursor-pointer',
                isSelected 
                  ? 'border-purple-500 bg-purple-50' 
                  : isMaxed
                  ? 'border-gray-200 bg-gray-50 opacity-50'
                  : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-purple-25'
              )}
              onClick={() => !isMaxed && handleFeatureToggle(feature)}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{feature.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">
                    {feature.name}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {feature.description}
                  </div>
                </div>
                {isSelected && (
                  <div className="text-purple-500">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              
              {/* Intensity Slider (only show when selected) */}
              {isSelected && (
                <div className="mt-2 pt-2 border-t border-purple-200">
                  <div className="text-xs font-medium text-gray-700 mb-1">
                    Intensity: {INTENSITY_LABELS[isSelected.intensity]}
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(level => (
                      <button
                        key={level}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleIntensityChange(feature.id, level as 1 | 2 | 3 | 4 | 5);
                        }}
                        className={clsx(
                          'flex-1 h-2 rounded-full transition-colors',
                          level <= isSelected.intensity
                            ? 'bg-purple-500'
                            : 'bg-gray-200 hover:bg-gray-300'
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Features Summary */}
      {selectedFeatures.length > 0 && (
        <div className="bg-purple-50 p-4 rounded-lg">
          <h4 className="font-medium text-purple-900 mb-2">
            Selected Roast Features:
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedFeatures.map(feature => (
              <div
                key={feature.id}
                className="inline-flex items-center gap-1 px-2 py-1 bg-purple-200 text-purple-800 rounded-full text-xs"
              >
                <span>{feature.icon}</span>
                <span>{feature.name}</span>
                <span className="text-purple-600">
                  ({INTENSITY_LABELS[feature.intensity]})
                </span>
                <button
                  onClick={() => handleFeatureToggle(feature)}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}