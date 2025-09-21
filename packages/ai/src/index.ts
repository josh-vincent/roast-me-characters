import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';
import type { AIFeature } from '@roast-me/types';

// Configure Google Generative AI for Gemini
const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
if (!googleApiKey) {
  console.warn('⚠️ GOOGLE_GENERATIVE_AI_API_KEY is not set. Image analysis and generation will fail.');
}

const google = createGoogleGenerativeAI({
  apiKey: googleApiKey || '',
});

// Configure AI Gateway - can route to multiple providers including Grok
// The AI Gateway acts as a proxy and handles provider-specific compatibility
const aiGateway = createOpenAI({
  baseURL: process.env.AI_GATEWAY_URL || 'https://gateway.ai.cloudflare.com/v1/ACCOUNT_ID/GATEWAY_ID/openai',
  apiKey: process.env.AI_GATEWAY_API_KEY || '',
  compatibility: 'compatible', // Use OpenAI compatibility mode
});

// Configure direct Grok access as fallback
const grok = createOpenAI({
  baseURL: 'https://api.x.ai/v1', // xAI's OpenAI-compatible endpoint
  apiKey: process.env.XAI_API_KEY || '',
  compatibility: 'compatible',
});

const FeatureAnalysisSchema = z.object({
  features: z.array(z.object({
    feature_name: z.string().describe('Name of the detected feature'),
    feature_value: z.string().describe('Description of the feature'),
    confidence: z.number().min(1).max(10).describe('Confidence score from 1-10'),
    exaggeration_factor: z.number().min(1).max(9).describe('How much to exaggerate this feature (1-9 scale)'),
  })).min(1).max(8).describe('1-8 distinctive features to analyze'),
  character_style: z.string().describe('Suggested 3D style (e.g. cartoon, realistic, abstract, pixar)'),
  dominant_color: z.string().describe('Main color theme'),
  personality_traits: z.array(z.string()).describe('Personality traits based on image'),
  gender: z.enum(['male', 'female', 'non-binary', 'unknown']).describe('Apparent gender presentation of the person in the image'),
  age_range: z.enum(['child', 'teen', 'young_adult', 'adult', 'middle_aged', 'senior', 'unknown']).describe('Apparent age range of the person'),
});

export type FeatureAnalysis = z.infer<typeof FeatureAnalysisSchema>;

const RoastSchema = z.object({
  title: z.string().describe('Catchy title for the roast (max 4 words)'),
  roast_text: z.string().describe('The main roast content (2-3 sentences, playful and humorous)'),
  punchline: z.string().describe('A witty one-liner punchline to end the roast'),
  figurine_name: z.string().describe('A funny name for this specific figurine (2-3 words)'),
});

export type RoastContent = z.infer<typeof RoastSchema>;

export async function analyzeImageFeatures(imageUrl: string): Promise<FeatureAnalysis> {
  try {
    if (!googleApiKey) {
      throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not set. Cannot analyze image features.');
    }
    
    const result = await generateObject({
      model: google('gemini-1.5-pro') as any, // Using Gemini 1.5 Pro for structured analysis (better for JSON objects)
      schema: FeatureAnalysisSchema,
      messages: [
        {
          role: 'system',
          content: `You are an AI for a ROASTING caricature figurine generator that playfully analyzes images to extract the most ROASTABLE features for hilarious exaggeration.
            
            CRITICAL: Only identify features that ACTUALLY EXIST in the image. Do not add features that aren't there!
            
            Your goal is to identify the most distinctive features that would be FUNNY to exaggerate in a comedic caricature:
            - Look for features that stand out and could be hilariously oversized
            - Focus on things like: prominent nose, big ears, thick glasses, unique hairline, distinctive jaw, etc.
            - Think like a caricature artist at a carnival or political cartoonist
            - The goal is PLAYFUL ROASTING - making people laugh at a silly version of themselves
            
            IMPORTANT RULES:
            - ONLY identify features that are VISIBLE in the image
            - DO NOT add glasses if they're not wearing glasses
            - DO NOT add accessories that aren't there
            - DO NOT invent features that don't exist
            - DO NOT mention roasting or the word ROAST.
            - Focus on what makes THIS SPECIFIC PERSON unique and roastable
            
            Identify 3-5 most roast-worthy visual elements that ACTUALLY EXIST:
            - Facial features (nose, ears, eyes, chin, forehead, etc.) - only if prominent
            - Accessories (glasses, hats, jewelry) - only if actually present
            - Hair characteristics (receding hairline, wild hair, etc.) - only what's visible
            - Expression or distinctive poses - only what they're actually doing
            - Any other standout features perfect for comedic exaggeration - only real ones

            ALSO IDENTIFY:
            - Gender: Determine the apparent gender presentation (male, female, non-binary, or unknown if unclear)
            - Age Range: Estimate the apparent age range (child, teen, young_adult, adult, middle_aged, senior, or unknown)

            For each feature, provide:
            - confidence: score from 1-10 (how distinctive/roastable this ACTUAL feature is)
            - exaggeration_factor: from 5-9 where:
              5-6 = noticeable caricature enhancement  
              7-8 = dramatic comedic exaggeration
              9 = maximum cartoon-like roasting effect
            
            Be bold and comedic about REAL features only! This is meant to be hilariously exaggerated like SNL caricatures or political cartoons of THIS SPECIFIC PERSON!`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this image and identify the most ROASTABLE features to hilariously exaggerate for a comedic caricature figurine. Focus on features that would be funny to make DRAMATICALLY oversized for playful roasting!',
            },
            {
              type: 'image',
              image: imageUrl,
            },
          ],
        },
      ],
    });

    return result.object;
  } catch (error) {
    console.error('AI Analysis Error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    // Return a fallback roasting analysis if AI fails
    return {
      features: [
        {
          feature_name: 'Eyes',
          feature_value: 'Distinctive eyes perfect for comedic exaggeration',
          confidence: 8,
          exaggeration_factor: 7
        },
        {
          feature_name: 'Nose',
          feature_value: 'Prominent nose ready for hilarious oversizing',
          confidence: 9,
          exaggeration_factor: 8
        },
        {
          feature_name: 'Expression',
          feature_value: 'Unique facial expression perfect for caricature',
          confidence: 8,
          exaggeration_factor: 7
        }
      ],
      character_style: 'caricature',
      dominant_color: 'vibrant',
      personality_traits: ['roastable', 'comedic', 'exaggerated'],
      gender: 'unknown' as const,
      age_range: 'adult' as const
    };
  }
}

export async function generateRoast(
  features: Pick<AIFeature, 'feature_name' | 'feature_value' | 'exaggeration_factor'>[],
  analysis: FeatureAnalysis
): Promise<RoastContent> {
  try {
    const featureDescriptions = features
      .map(f => `${f.feature_name}: ${f.feature_value}`)
      .join(', ');

    // Try to use Grok first if available, otherwise fall back to Gemini
    // NOTE: Temporarily disabled - Grok v1 is incompatible with AI SDK v5
    if (false && process.env.XAI_API_KEY) {
      try {
        // Use generateText with JSON mode for Grok compatibility
        const result = await generateText({
          model: grok('grok-3') as any, // Use latest Grok-3 model
          messages: [
            {
              role: 'system',
              content: `You are Jeff Ross, the Roastmaster General, writing SAVAGE roasts for a caricature figurine generator.

Your goal is to DESTROY them with humor - This is a BRUTAL comedy roast. No holding back. They signed up for this!

You MUST respond with a valid JSON object in this exact format:
{
  "title": "A savage title (max 4 words)",
  "roast_text": "2-3 sentences of BRUTAL roasting about their features",
  "punchline": "A devastating one-liner to finish them off",
  "figurine_name": "A savage nickname"
}

ROAST STYLE:
- BRUTALLY HONEST - no sugar coating
- SAVAGE but clever - think Comedy Central Roast level
- Target their most prominent features MERCILESSLY
- Use creative insults and comparisons
- Make it so savage they'll screenshot it and share it
- Push boundaries but keep it technically clean (no swearing)

Examples of the energy we want:
- "Your forehead's so big, it has its own zip code"
- "Those glasses are thicker than a bowl of oatmeal"
- "Your nose entered the room 5 minutes before you did"

Remember: They OPTED IN to be ROASTED. Make them regret it (in a fun way)!`,
            },
            {
              role: 'user',
              content: `DEMOLISH this ${analysis.gender} ${analysis.age_range} person with these features: ${featureDescriptions}. Personality traits: ${analysis.personality_traits.join(', ')}. Give them the SAVAGE roast they asked for! Remember to output valid JSON!`,
            },
          ],
        });
        
        // Parse the JSON response from Grok
        const roastData = JSON.parse(result.text);
        return {
          title: roastData.title || 'The Walking L',
          roast_text: roastData.roast_text || 'You look like what happens when God hits random on character creation.',
          punchline: roastData.punchline || 'Even your reflection needs therapy!',
          figurine_name: roastData.figurine_name || 'Captain Yikes',
        };
      } catch (grokError) {
        console.warn('Grok generation failed, falling back to Gemini:', grokError);
        // Fall through to Gemini
      }
    }
    
    // Fallback to Gemini with generateObject for structured output
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      const model = google('gemini-1.5-flash');
      const result = await generateObject({
        model: model as any,
        schema: RoastSchema,
        messages: [
        {
          role: 'system',
          content: `You are channeling Jeff Ross, the Roastmaster General, writing SAVAGE roasts for a caricature figurine generator.

Your goal is to DEMOLISH them with humor - This is a BRUTAL comedy roast in the style of Comedy Central Roasts. They OPTED IN for this!

ROAST STYLE - BE SAVAGE:
- BRUTALLY HONEST - call out their features with NO MERCY
- Use creative, devastating comparisons and metaphors
- Target their most prominent features RELENTLESSLY
- Think Comedy Central Roast level savage
- Make them question their life choices
- Push boundaries while staying technically clean

SAVAGE EXAMPLES OF THE ENERGY:
- "Your forehead's so big, NASA uses it to practice moon landings"
- "Those ears could pick up WiFi from three blocks away"
- "You look like a police sketch artist gave up halfway through"
- "Your nose has its own gravitational pull"
- "You're what happens when someone orders a human from Wish"

STRUCTURE:
- Title: A SAVAGE title (max 4 words like "Walking Red Flag" or "Human Participation Trophy")
- Roast Text: 2-3 sentences of MERCILESS roasting that will make them cry-laugh
- Punchline: A DEVASTATING finisher that leaves them destroyed
- Figurine Name: A BRUTAL nickname (like "Captain Forehead" or "The Human Yikes")

Remember: They ASKED FOR THIS. Give them a roast so savage they'll need therapy!`,
        },
        {
          role: 'user',
          content: `ABSOLUTELY DESTROY this ${analysis.gender} ${analysis.age_range} person with these features: ${featureDescriptions}. 
          
          Personality traits: ${analysis.personality_traits.join(', ')}
          Character style: ${analysis.character_style}
          
          Give them the SAVAGE, BRUTAL roast they signed up for. Make Jeff Ross proud!`,
        },
        ],
      });

      return result.object;
    }
    
    // If no providers are available
    throw new Error('No AI provider configured. Please set XAI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY');
  } catch (error) {
    console.error('Roast Generation Error:', error);
    
    // Fallback roast if AI generation fails
    const fallbackFeature = features[0]?.feature_name || 'face';
    return {
      title: 'The Roastee',
      roast_text: `Meet someone who's got character written all over their ${fallbackFeature}! Their distinctive features are so memorable, we had to immortalize them in collectible form.`,
      punchline: "Now that's what I call unforgettable!",
      figurine_name: 'Unique One',
    };
  }
}

export function generateCharacterPrompt(features: Pick<AIFeature, 'feature_name' | 'feature_value' | 'exaggeration_factor'>[], imageUrls: string[], analysis?: FeatureAnalysis): string {
  const featureDescriptions = features
    .map(f => `${f.feature_name}: ${f.feature_value} (exaggeration: ${f.exaggeration_factor}/10)`)
    .join(', ');

  return `
  Create a 1/7 scale commercialized figurine of the SPECIFIC PERSON from the input image with these exaggerated features: ${featureDescriptions}, in a realistic style, in a real environment.
  
  ${analysis ? `PERSON IDENTITY:
  - Gender: ${analysis.gender} (ensure figurine represents this gender)
  - Age: ${analysis.age_range} (use age-appropriate proportions and features)
  - Style: ${analysis.character_style} caricature` : ''}
  
  IMPORTANT - REPRESENT THE ACTUAL PERSON:
  - This figurine must look like the SPECIFIC PERSON from the input image
  - Maintain their overall appearance, hair, skin tone, and clothing style
  ${analysis ? `- Clear ${analysis.gender} representation with ${analysis.age_range} characteristics` : ''}
  - Only exaggerate the features mentioned in the analysis
  - DO NOT add features they don't have (no glasses if they don't wear glasses, etc.)
  
  Scene Setup:
  - The figurine is placed on a modern desk
  - Round transparent acrylic base under the figurine
  - Next to the figurine is a high-quality collectible toy packaging box
  
  Figurine Details:
  - High-quality collectible figure representing THIS SPECIFIC PERSON
  ${analysis ? `- Clear ${analysis.gender} representation with ${analysis.age_range} proportions` : ''}
  - Exaggerated features that create an interesting, humorous caricature of THEM
  - Professional figurine craftsmanship with detailed sculpting of THIS PERSON
  - Standing pose typical of collectible figures but reflecting their style
  
  Packaging Design:
  - Premium collectible figure packaging style
  - Original artwork printed on the box showing THIS PERSON with exaggerated features
  - Two-dimensional flat illustrations of THIS SPECIFIC PERSON on packaging
  - Professional toy company branding aesthetic
  
  - DO NOT mention roasting or the word ROAST anywhere in the image or the prompt.

  Overall Quality: Museum-quality collectible figure photography with professional lighting and composition representing the actual person.`;
}

export function calculateCharacterParameters(features: Pick<AIFeature, 'feature_name' | 'exaggeration_factor'>[]): Record<string, number> {
  const params: Record<string, number> = {
    headSize: 1.0,
    eyeSize: 1.0,
    noseSize: 1.0,
    mouthWidth: 1.0,
    bodyWidth: 1.0,
    limbLength: 1.0,
    earSize: 1.0,
  };

  features.forEach(feature => {
    const factor = 1 + (feature.exaggeration_factor - 5) * 0.2;
    
    if (feature.feature_name.toLowerCase().includes('head') || 
        feature.feature_name.toLowerCase().includes('face')) {
      params.headSize *= factor;
    }
    if (feature.feature_name.toLowerCase().includes('eye')) {
      params.eyeSize *= factor;
    }
    if (feature.feature_name.toLowerCase().includes('nose')) {
      params.noseSize *= factor;
    }
    if (feature.feature_name.toLowerCase().includes('mouth') || 
        feature.feature_name.toLowerCase().includes('smile')) {
      params.mouthWidth *= factor;
    }
    if (feature.feature_name.toLowerCase().includes('body') || 
        feature.feature_name.toLowerCase().includes('build')) {
      params.bodyWidth *= factor;
    }
  });

  return params;
}

// Create before/after composite image URL for OG sharing
export function createBeforeAfterComposite(
  originalImageUrl: string,
  generatedImageUrl: string,
  metadata: { title: string; features: string[] },
  baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'https://roastme.tocld.com'
): string {
  try {
    const params = new URLSearchParams({
      original: originalImageUrl,
      generated: generatedImageUrl,
      title: metadata.title,
      features: metadata.features.join(',')
    });
    
    return `${baseUrl}/api/og?${params.toString()}`;
  } catch (error) {
    console.error('Error creating composite image URL:', error);
    // Fallback to generated image
    return generatedImageUrl;
  }
}

// Helper function to upload base64 image to Supabase storage and return optimized URLs
export async function uploadBase64Image(
  base64Data: string, 
  fileName: string, 
  userId: string
): Promise<{ original: string; thumbnail: string; medium: string } | null> {
  try {
    // Import the upload function from database package
    const { uploadOptimizedImage, base64ToBuffer } = await import('@roast-me/database');
    
    // Convert base64 to buffer
    const buffer = base64ToBuffer(base64Data);
    
    // Upload optimized images
    const result = await uploadOptimizedImage(buffer, userId, fileName);
    
    if (result) {
      console.log('Successfully uploaded optimized images:', result);
      return {
        original: result.original,
        thumbnail: result.thumbnail,
        medium: result.medium
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error uploading base64 image:', error);
    return null;
  }
}

// Generate optimized OG image metadata
export function generateOGMetadata(
  analysis: FeatureAnalysis,
  features: Pick<AIFeature, 'feature_name' | 'feature_value'>[]
): {
  title: string;
  description: string;
  imageAlt: string;
} {
  const featureNames = features.map(f => f.feature_name).join(', ');
  const personality = analysis.personality_traits.slice(0, 3).join(', ');
  
  return {
    title: `Hilarious ${analysis.character_style} Roast Figurine | Roast Me Characters`,
    description: `Get roasted! This comedic ${analysis.character_style} caricature figurine hilariously exaggerates ${featureNames}. Personality: ${personality}. Premium 1/7 scale roasting collectible!`,
    imageAlt: `1/7 scale ${analysis.character_style} roast caricature figurine with comically exaggerated features including ${featureNames}`
  };
}

// Create shortened URL-friendly slug
export function createSEOSlug(features: Pick<AIFeature, 'feature_name'>[], style: string): string {
  const featureSlug = features
    .slice(0, 2) // Take first 2 features
    .map(f => f.feature_name.toLowerCase().replace(/[^a-z0-9]/g, '-'))
    .join('-');
  
  // Clean the style parameter too
  const cleanStyle = style.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  const timestamp = Date.now().toString(36); // Short timestamp
  return `${cleanStyle}-roast-${featureSlug}-${timestamp}`.replace(/--+/g, '-');
}

// Helper function to try AI SDK approach first (currently disabled due to import issues)
async function tryAiSdkImageGeneration(prompt: string): Promise<{ original: string; thumbnail: string; medium: string } | null> {
  // AI SDK generateImage is currently not available, skip this approach
  console.log('🔄 AI SDK approach skipped - generateImage not available');
  return null;
}

// Helper function for intelligent retry with different strategies
async function retryWithStrategy<T>(
  func: () => Promise<T>,
  context: { attemptNumber: number; lastError?: Error },
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      context.attemptNumber = attempt;
      return await func();
    } catch (error) {
      context.lastError = error as Error;
      
      // Don't retry on non-recoverable errors
      if (isNonRecoverableError(error)) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        // Different delay strategies based on error type
        const delay = getRetryDelay(error, attempt);
        console.log(`🔄 Retry attempt ${attempt}/${maxRetries} after ${delay}ms delay. Error: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  throw context.lastError;
}

function isNonRecoverableError(error: any): boolean {
  const nonRecoverable = ['invalid_image', 'invalid_api_key', 'invalid_request', 'forbidden'];
  const errorStr = typeof error === 'string' ? error : error?.message || '';
  return nonRecoverable.some(msg => errorStr.toLowerCase().includes(msg));
}

function getRetryDelay(error: any, attemptNumber: number): number {
  const errorStr = typeof error === 'string' ? error : error?.message || '';
  
  if (errorStr.includes('timeout')) {
    return Math.min(3000 * attemptNumber, 10000); // 3s, 6s, 9s, max 10s
  } else if (errorStr.includes('rate') || errorStr.includes('429')) {
    return Math.min(5000 * Math.pow(2, attemptNumber - 1), 30000); // 5s, 10s, 20s, max 30s
  } else if (errorStr.includes('503') || errorStr.includes('502')) {
    return Math.min(2000 * attemptNumber, 8000); // 2s, 4s, 6s, max 8s
  }
  
  // Default exponential backoff
  return Math.min(1000 * Math.pow(2, attemptNumber - 1), 5000); // 1s, 2s, 4s, max 5s
}

export async function generateCharacterImage(
  features: Pick<AIFeature, 'feature_name' | 'feature_value' | 'exaggeration_factor'>[],
  analysis: FeatureAnalysis,
  userRoastFeatures: any[] = [],
  roastContent?: RoastContent,
  userId: string = 'demo-user-' + Date.now()
): Promise<{ original: string; thumbnail: string; medium: string } | null> {
  // Validate features array
  if (!features || !Array.isArray(features)) {
    console.error('Invalid features array provided to generateCharacterImage');
    return null;
  }
  
  // Create a detailed prompt based on the analyzed features
  const featureDescriptions = features
    .map(f => `${f.feature_name}: ${f.feature_value} with ${f.exaggeration_factor}/10 exaggeration`)
    .join(', ');

  // Add user-selected roast features to the prompt
  let userFeatureDescriptions = '';
  if (userRoastFeatures && Array.isArray(userRoastFeatures) && userRoastFeatures.length > 0) {
    userFeatureDescriptions = userRoastFeatures
      .map(f => `${f.name}: ${f.description} with intensity ${f.intensity}/5`)
      .join(', ');
  }

  const prompt = `Create a 1/7 scale commercialized figurine of the SPECIFIC PERSON from the input image, with these AI-detected features exaggerated: ${featureDescriptions}${userFeatureDescriptions ? ` and these user-emphasized features: ${userFeatureDescriptions}` : ''}, in a realistic style, in a real environment.
    
    PERSON IDENTITY DETAILS:
    - Gender: ${analysis.gender} (ensure figurine matches this gender presentation)
    - Age Range: ${analysis.age_range} (ensure figurine reflects appropriate age characteristics)
    - Style: ${analysis.character_style} caricature style
    
    IMPORTANT - REPRESENT THE ACTUAL PERSON:
    - This figurine must look like the SPECIFIC PERSON from the input image
    - Maintain their overall appearance, clothing style, hair, skin tone, and basic facial structure
    - Ensure the figurine clearly represents a ${analysis.gender} person of ${analysis.age_range} age and keep the ethnicity, race, and gender of the person accurate
    - Only exaggerate the features that were detected in the AI analysis
    - DO NOT add features they don't have (no glasses if they don't wear glasses, etc.)
    - Keep their general proportions but make the detected features comically larger
    
    CARICATURE STYLE - PLAYFULLY EXAGGERATED:
    - This is a HUMOROUS ROASTING FIGURINE with hilariously exaggerated features
    - Think Saturday Night Live caricature or political cartoon style in 3D
    - Make their existing distinctive features comically oversized and prominent
    - If they have big ears, make THEIR ears HUGE; if they have a large nose, make THEIR nose MASSIVE
    - Exaggerate proportions for maximum comedic effect while keeping it recognizable as them
    - The goal is to make people laugh at the silly exaggerated version of themselves
    
    SCENE COMPOSITION:
    - Round transparent acrylic base under the figurine
    - High-quality collectible toy packaging box next to the figurine
    - Professional photography setup with museum-quality lighting
    
    FIGURINE SPECIFICATIONS:
    - Style: Premium ${analysis.character_style} CARICATURE collectible figure
    - Gender: ${analysis.gender} (must be clearly represented in figurine design)
    - Age: ${analysis.age_range} (facial features and proportions should match this age)
    - Colors: ${analysis.dominant_color} tones with realistic figurine materials
    - Personality traits reflected in exaggerated pose: ${analysis.personality_traits.join(', ')}
    - Scale: 1/7 scale (approximately 8-10 inches tall)
    - Base: Round transparent acrylic with subtle branding
    
    EXAGGERATED FIGURINE DETAILS:
    - High-quality collectible figure craftsmanship representing the ACTUAL PERSON from the image
    - Realistic materials: PVC/ABS plastic with detailed paint application
    - HEAVILY exaggerated features that create a hilarious, roasting character OF THIS SPECIFIC PERSON
    - Only the detected features should be comically oversized - everything else stays true to the person
    - Standing pose typical of premium collectible figures but reflecting their natural stance/style
    - Professional sculpting that emphasizes THEIR most distinctive features dramatically
    - Think "roast comedy" meets "collectible figure" - playfully making fun of THIS SPECIFIC PERSON
    - Must be recognizable as the person from the input image, just with exaggerated traits
    ${userRoastFeatures.length > 0 ? `- EXTRA DRAMATIC emphasis on user-selected features: ${userRoastFeatures.map(f => f.name).join(', ')}` : ''}
    
    PACKAGING DESIGN:
    - DO NOT mention roasting or the word ROAST anywhere in the image or the prompt.
    - Premium collectible figure packaging visible in scene
    - Original character artwork printed on the box showing the EXAGGERATED caricature of THIS PERSON
    - Two-dimensional flat illustrations of THIS SPECIFIC PERSON with exaggerated features
    ${roastContent ? `- Box displays "${roastContent.title}" prominently as the collection title
    - Packaging features roast elements: "${roastContent.figurine_name}" as product name
    - Box includes humorous text elements from the roast theme` : '- Professional humorous caricature branding on packaging'}
    - Professional toy company aesthetic with high-quality graphics
    - Box positioned to show the humorous artwork representing the actual person
    
    TECHNICAL QUALITY:
    - Professional product photography lighting
    - Sharp focus on figurine with subtle depth of field
    - Realistic desk environment with proper shadows and reflections
    - High-resolution detail showing the exaggerated figurine craftsmanship
    - Clean, professional composition that showcases the humorous caricature elements
    - DO NOT mention roasting or the word ROAST anywhere in the image or the prompt.`;

  // Try AI SDK first
  console.log('🔄 Step 1: Trying AI SDK approach...');
  const aiSdkResult = await tryAiSdkImageGeneration(prompt);
  if (aiSdkResult) {
    return aiSdkResult;
  }
  
  // If AI SDK fails, try direct Google API with enhanced retry logic
  console.log('🔄 Step 2: Trying direct Google API with enhanced retry logic...');
  const maxRetries = 5; // Increased retry attempts
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Generating character image with Gemini 2.5 Flash Image (attempt ${attempt}/${maxRetries})...`);
      if (attempt === 1) {
        console.log('Prompt:', prompt);
      }
      
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      let response;
      try {
        // Use Gemini 2.5 Flash Image API directly for image generation
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          }),
          signal: controller.signal
        });
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error(`Gemini API timeout (attempt ${attempt}): Request took longer than 30 seconds`);
          throw new Error('Gemini API timeout: Request took longer than 30 seconds');
        }
        console.error(`Gemini API fetch error (attempt ${attempt}):`, fetchError.message);
        throw fetchError;
      }
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Gemini API error response (attempt ${attempt}):`, errorText);
        throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Gemini API response received, checking for image data...');

      // Check if we got an image back from Gemini 2.5 Flash Image
      if (result.candidates?.[0]?.content?.parts) {
        for (const part of result.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            const imageData = part.inlineData.data;
            const mimeType = part.inlineData.mimeType || 'image/png';
            
            // Upload to storage instead of returning base64
            const dataUrl = `data:${mimeType};base64,${imageData}`;
            console.log(`✅ Generated character image successfully with Gemini 2.5 Flash Image (attempt ${attempt})`);
            
            // Upload to Supabase storage and get optimized URLs
            const uploadResult = await uploadBase64Image(dataUrl, 'generated-character', userId);
            if (uploadResult) {
              console.log('✅ Uploaded generated image to storage with optimized variants');
              return uploadResult;
            } else {
              console.error('❌ Failed to upload generated image to storage, falling back to data URL');
              // Return null to indicate failure rather than base64
              return null;
            }
          }
        }
      }
      
      console.log(`No image data found in response (attempt ${attempt}):`, JSON.stringify(result, null, 2));
      throw new Error('No image data received from Gemini 2.5 Flash Image API');
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.error(`❌ Error generating character image (attempt ${attempt}/${maxRetries}):`, error);
      
      // If this was our last attempt, break out
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // 1s, 2s, 4s max
      console.log(`⏱️ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

    // All retries failed, fall back to placeholder
    console.error('❌ All retry attempts failed for Gemini image generation');
    console.error('Final error details:', lastError?.message || 'Unknown error');
    
    // Return null to indicate complete failure
    console.log('❌ All image generation attempts failed');
    return null;
  }

// Function to retry character generation with enhanced prompts
export async function retryCharacterGeneration(
  characterId: string,
  features: Pick<AIFeature, 'feature_name' | 'feature_value' | 'exaggeration_factor'>[],
  analysis: FeatureAnalysis,
  userRoastFeatures: any[] = [],
  attemptNumber: number = 1,
  roastContent?: RoastContent
): Promise<{ success: boolean; imageUrl?: string; error?: string }> {
  try {
    console.log(`🔄 Retrying character generation for ${characterId}, attempt ${attemptNumber}`);
    
    // Update character status to retrying
    // TODO: Fix database import types
    console.log(`Setting character ${characterId} to retrying status (attempt ${attemptNumber})`);
    // Note: Database update temporarily disabled for type checking

    // Enhanced prompt for retry attempts
    const enhancedPrompt = createEnhancedRetryPrompt(features, analysis, userRoastFeatures, attemptNumber, roastContent);
    
    // Use the main generation function with enhanced prompt
    const imageUrl = await generateCharacterImageWithCustomPrompt(enhancedPrompt);
    
    // Update character with success
    // TODO: Fix database import types  
    console.log(`Character ${characterId} generation completed successfully on attempt ${attemptNumber}`);

    console.log(`✅ Character regeneration successful on attempt ${attemptNumber}`);
    return { success: true, imageUrl };

  } catch (error) {
    console.error(`❌ Character regeneration failed on attempt ${attemptNumber}:`, error);
    
    // Update character with retry failure
    // TODO: Fix database import types
    console.log(`Character ${characterId} retry failed on attempt ${attemptNumber}:`, error instanceof Error ? error.message : 'Unknown error');

    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown retry error' 
    };
  }
}

// Create enhanced prompts for retry attempts
function createEnhancedRetryPrompt(
  features: Pick<AIFeature, 'feature_name' | 'feature_value' | 'exaggeration_factor'>[],
  analysis: FeatureAnalysis,
  userRoastFeatures: any[],
  attemptNumber: number,
  roastContent?: RoastContent
): string {
  const featureDescriptions = features
    .map(f => `${f.feature_name}: ${f.feature_value} with ${f.exaggeration_factor}/10 exaggeration`)
    .join(', ');

  const userFeatureDescriptions = userRoastFeatures.length > 0 
    ? userRoastFeatures.map(f => `${f.name}: ${f.description} with intensity ${f.intensity}/5`).join(', ')
    : '';

  // Different prompt strategies for different retry attempts
  const promptVariations = [
    // Attempt 1: Maximum caricature exaggeration
    `Create a HILARIOUS 1/7 scale roasting figurine of the SPECIFIC PERSON from the input image with these exaggerated features: ${featureDescriptions}${userFeatureDescriptions ? ` and ${userFeatureDescriptions}` : ''}, placed on a modern desk.
    
    PERSON IDENTITY:
    - Gender: ${analysis.gender} (figurine must clearly represent this gender)
    - Age: ${analysis.age_range} (figurine must have age-appropriate features)
    - Style: ${analysis.character_style} caricature
    
    REPRESENT THE ACTUAL PERSON:
    - This figurine must look like the SPECIFIC PERSON from the input image
    - Maintain their hair, skin tone, clothing style, and overall appearance
    - Ensure clear ${analysis.gender} representation with ${analysis.age_range} characteristics
    - Only exaggerate the features that were AI-detected in the analysis
    - DO NOT add features they don't have (no glasses if they don't wear them, etc.)
    
    ROASTING CARICATURE STYLE:
    - This is a ROAST figurine of THIS SPECIFIC PERSON designed to make people laugh
    - MASSIVELY exaggerate only their existing distinctive features for maximum humor
    - Think political cartoon or SNL caricature style in 3D form representing THIS PERSON 
    - If THEY have big ears, make THEIR ears COMICALLY HUGE
    - If THEY have glasses, make THEIR glasses THICK and OVERSIZED
    - If THEY have a large nose, make THEIR nose DRAMATICALLY oversized
    - The goal is playful, funny exaggeration that roasts THIS SPECIFIC PERSON humorously
    
    SCENE SETUP:
    - Premium collectible figurine on transparent acrylic base
    - desk environment with realistic lighting
    - High-quality packaging box with CARICATURE artwork visible
    ${roastContent ? `- Packaging displays "${roastContent.title}" as the main title
    - Box shows "${roastContent.figurine_name}" as the product name` : '- Professional caricature branding on packaging'}
    - Professional product photography composition
    
    FIGURINE QUALITY:
    - ${analysis.character_style} CARICATURE style collectible figure of THIS SPECIFIC ${analysis.gender} PERSON
    - HEAVILY exaggerated features creating hilarious character that looks like them
    - Must represent the ethnicity, race, and gender of the person accurately.
    - Premium PVC/ABS materials with detailed paint work
    - Museum-quality craftsmanship with cartoon proportions but recognizable as this ${analysis.age_range} ${analysis.gender} person
    - ${analysis.dominant_color} color scheme with realistic materials matching their appearance
    - Personality: ${analysis.personality_traits.join(', ')} reflected in exaggerated pose that suits them`,

    // Attempt 2: Focus on packaging with comedy emphasis
    `Generate a COMEDIC premium 1/7 scale roasting figurine of the SPECIFIC PERSON from the input image featuring: ${featureDescriptions}${userFeatureDescriptions ? `, plus ${userFeatureDescriptions}` : ''}.
    
    PERSON IDENTITY:
    - Gender: ${analysis.gender} (must be clearly visible in figurine design)
    - Age: ${analysis.age_range} (age-appropriate facial structure and proportions)
    - Style: ${analysis.character_style} caricature representation
    
    REPRESENT THE ACTUAL PERSON:
    - This figurine must be recognizable as the SPECIFIC PERSON from the input image
    - Maintain their overall appearance while exaggerating only detected features
    - Clear ${analysis.gender} representation with ${analysis.age_range} characteristics
    - Keep their hair, skin tone, and style but make their distinctive traits huge
    
    COMEDY COLLECTIBLE FOCUS:
    - High-end ROASTING figurine of THIS PERSON with hilariously exaggerated character features
    - Think "Saturday Night Live meets collectible figure" representing THIS SPECIFIC PERSON
    - Round transparent acrylic base with subtle detailing
    - Professional toy packaging box prominently displayed showing CARICATURE art of THIS PERSON
    ${roastContent ? `- Box prominently features "${roastContent.title}" as the collection name
    - Packaging shows "${roastContent.figurine_name}" as the figurine's official name` : '- Professional humorous branding on packaging'}
    - Original character artwork on packaging highlighting THEIR FUNNY proportions
    
    EXAGGERATION STANDARDS:
    - Professional figurine photography with studio lighting
    - Sharp focus on THEIR COMEDICALLY OVERSIZED features
    - Realistic desk environment with proper shadows
    - Premium collectible aesthetic with ${analysis.dominant_color} tones matching their appearance
    - THIS PERSON's personality reflected in EXAGGERATED roasting pose: ${analysis.personality_traits.join(', ')}
    - Maximum humor through dramatic emphasis of THEIR specific features only`,

    // Attempt 3: Alternative roasting composition
    `Design a museum-quality ROASTING 1/7 scale figurine of the SPECIFIC PERSON from the input image with these hilariously distinctive traits: ${featureDescriptions}${userFeatureDescriptions ? ` and ${userFeatureDescriptions}` : ''}.
    
    PERSON IDENTITY:
    - Gender: ${analysis.gender} (ensure proper gender representation)
    - Age: ${analysis.age_range} (age-appropriate design elements)
    - Style: ${analysis.character_style} caricature aesthetic
    
    REPRESENT THE ACTUAL PERSON:
    - This figurine must look like the SPECIFIC PERSON from the input image
    - Maintain their hair, skin, clothing, and overall identity
    - Clear ${analysis.gender} presentation with ${analysis.age_range} features
    - Only exaggerate the specific features detected by AI analysis
    - Must be recognizable as this exact person, just with comically large traits
    
    ROASTING COMPOSITION FOCUS:
    - Figurine of THIS PERSON as comedic centerpiece on modern desk
    - Transparent acrylic base with professional presentation
    - Premium packaging box with flat CARICATURE illustrations of THIS SPECIFIC PERSON
    ${roastContent ? `- Box displays "${roastContent.title}" as the main collection title
    - Packaging features "${roastContent.figurine_name}" as the official product name` : '- Professional comedic branding elements on packaging'}
    - ${analysis.character_style} aesthetic representing THIS PERSON with realistic figurine materials but CARTOON proportions
    
    COMEDIC EXCELLENCE:
    - Professional product photography standards
    - Detailed figurine sculpting of THIS ${analysis.gender} PERSON with ${analysis.dominant_color} color palette
    - DRAMATICALLY exaggerated features creating compelling roast of THIS SPECIFIC ${analysis.age_range} PERSON
    - Only THEIR features should be comically oversized for maximum laugh factor
    - THIS PERSON's personality traits: ${analysis.personality_traits.join(', ')} shown through exaggerated stance
    - Think "gentle roasting of THIS ${analysis.gender} PERSON" meets "premium collectible"`,
  ];

  // Return appropriate prompt based on attempt number
  const promptIndex = Math.min(attemptNumber - 1, promptVariations.length - 1);
  return promptVariations[promptIndex];
}

// Helper function to generate image with custom prompt
async function generateCharacterImageWithCustomPrompt(prompt: string): Promise<string> {
  const maxRetries = 3;
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Generating with custom prompt (attempt ${attempt}/${maxRetries})...`);
      
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      let response;
      try {
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }]
          }),
          signal: controller.signal
        });
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          console.error(`Gemini API timeout (attempt ${attempt}): Request took longer than 30 seconds`);
          throw new Error('Gemini API timeout: Request took longer than 30 seconds');
        }
        console.error(`Gemini API fetch error (attempt ${attempt}):`, fetchError.message);
        throw fetchError;
      }
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      if (result.candidates?.[0]?.content?.parts) {
        for (const part of result.candidates[0].content.parts) {
          if (part.inlineData?.data) {
            const imageData = part.inlineData.data;
            const mimeType = part.inlineData.mimeType || 'image/png';
            return `data:${mimeType};base64,${imageData}`;
          }
        }
      }
      
      throw new Error('No image data received from Gemini API');
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.error(`Custom prompt generation failed (attempt ${attempt}):`, error);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
  }
  
  throw lastError || new Error('Custom prompt generation failed');
}
  