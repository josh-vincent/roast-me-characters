import { generateText } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { NextRequest } from 'next/server';
import { z } from 'zod';

// Roast schema for structured output
const RoastSchema = z.object({
  title: z.string().describe('Catchy title for the roast (max 4 words)'),
  roast_text: z.string().describe('The main roast content (2-3 sentences, playful and humorous)'),
  punchline: z.string().describe('A witty one-liner punchline to end the roast'),
  figurine_name: z.string().describe('A funny name for this specific figurine (2-3 words)'),
});

export async function POST(request: NextRequest) {
  // Gateway automatically uses AI_GATEWAY_API_KEY environment variable
  try {
    const body = await request.json();
    const { features, analysis } = body;

    if (!features || !analysis) {
      return Response.json(
        { error: 'Missing features or analysis data' },
        { status: 400 }
      );
    }

    // Create feature descriptions for the roast prompt
    const featureDescriptions = features
      .map((f: any) => `${f.feature_name}: ${f.feature_value}`)
      .join(', ');

    // Generate roast using Grok via AI Gateway with structured output
    const result = await generateText({
      model: gateway('xai/grok-3'),
      messages: [
        {
          role: 'system',
          content: `You are a professional roast comedian creating playful, humorous roasts for a caricature figurine generator.

Your goal is to create a FUNNY, PLAYFUL roast that makes people laugh - This is like a comedy roast, you are a roast master, be accurate for instance if the person is 
large and has a big nose, you should roast them for it or if they have big ears you can roast them using terms like "ear enthusiast" or "dumbo" be like this for all features. 

ROAST STYLE:
- Playful and humorous
- Focus on the exaggerated features in a funny way
- Think comedy club roast or aggressive banter between friends
- Make it quotable and shareable

STRUCTURE:
- Title: A catchy, funny title (max 4 words like "The Ear Enthusiast" or "Nose Knows Best")
- Roast Text: 2-3 sentences of playful roasting about their features
- Punchline: A witty one-liner to finish strong
- Figurine Name: A funny collectible name (like "Big Mike" or "Specs McGee")

Remember: This should make the person LAUGH, not feel bad. It's all in good fun!

IMPORTANT: You must respond with a valid JSON object in this exact format:
{
  "title": "your title here",
  "roast_text": "your roast text here",
  "punchline": "your punchline here", 
  "figurine_name": "your figurine name here"
}

No markdown, no backticks, no explanation - just the JSON object.`,
        },
        {
          role: 'user',
          content: `Create a playful roast for a ${analysis.gender} ${analysis.age_range} person with these exaggerated features: ${featureDescriptions}. 
          
          Personality traits: ${analysis.personality_traits?.join(', ') || 'unique'}
          Character style: ${analysis.character_style || 'cartoon'}
          
          Make it funny and quotable while being respectful and fun!`,
        },
      ],
      temperature: 0.8, // Add some creativity
      maxOutputTokens: 300, // AI SDK 5 renamed maxTokens to maxOutputTokens
    });

    // Parse and validate the JSON response
    let jsonText = result.text.trim();
    
    // Clean up any markdown formatting
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json\n|\n```/g, '');
    }
    
    // Remove any extra text before or after the JSON
    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonText = jsonMatch[0];
    }

    let roastContent;
    try {
      const parsedJson = JSON.parse(jsonText);
      roastContent = RoastSchema.parse(parsedJson);
    } catch (parseError) {
      console.error('Failed to parse roast JSON:', parseError);
      console.error('Raw response:', result.text);
      
      // Fallback roast if parsing fails
      const fallbackFeature = features[0]?.feature_name || 'face';
      roastContent = {
        title: 'The Roastee',
        roast_text: `Meet someone who's got character written all over their ${fallbackFeature}! Their distinctive features are so memorable, we had to immortalize them in collectible form.`,
        punchline: "Now that's what I call unforgettable!",
        figurine_name: 'Unique One',
      };
    }

    return Response.json({
      success: true,
      roast: roastContent,
    });

  } catch (error) {
    console.error('Error generating roast:', error);
    
    // Return a fallback roast in case of any errors
    return Response.json({
      success: true,
      roast: {
        title: 'The Legend',
        roast_text: 'Here stands someone so unique, they broke the mold when they were made! Their one-of-a-kind features deserve their own collectible figurine.',
        punchline: 'Some people are just naturally collectible!',
        figurine_name: 'The Original',
      },
    });
  }
}