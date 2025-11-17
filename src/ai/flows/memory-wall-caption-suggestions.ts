'use server';

/**
 * @fileOverview Provides AI-powered caption suggestions for memory wall entries.
 *
 * - getCaptionSuggestions - A function that generates caption suggestions for a memory wall entry.
 * - CaptionSuggestionsInput - The input type for the getCaptionSuggestions function.
 * - CaptionSuggestionsOutput - The return type for the getCaptionSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CaptionSuggestionsInputSchema = z.object({
  imageDescription: z
    .string()
    .describe('A description of the image for which a caption is desired.'),
  additionalContext: z
    .string()
    .optional()
    .describe('Any additional context to help generate the caption.'),
});
export type CaptionSuggestionsInput = z.infer<typeof CaptionSuggestionsInputSchema>;

const CaptionSuggestionsOutputSchema = z.object({
  captions: z
    .array(z.string())
    .describe('An array of suggested captions for the memory wall entry.'),
});
export type CaptionSuggestionsOutput = z.infer<typeof CaptionSuggestionsOutputSchema>;

export async function getCaptionSuggestions(
  input: CaptionSuggestionsInput
): Promise<CaptionSuggestionsOutput> {
  return captionSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'captionSuggestionsPrompt',
  input: {schema: CaptionSuggestionsInputSchema},
  output: {schema: CaptionSuggestionsOutputSchema},
  prompt: `You are a memory wall curator helping users create meaningful captions for their memories.

  Given the image description and any additional context, generate three diverse caption suggestions.

  Image Description: {{{imageDescription}}}
  Additional Context: {{{additionalContext}}}

  Captions:
  1.`, // The LLM will generate from '1.' assuming the desired structure.
});

const captionSuggestionsFlow = ai.defineFlow(
  {
    name: 'captionSuggestionsFlow',
    inputSchema: CaptionSuggestionsInputSchema,
    outputSchema: CaptionSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);

    // Post-process to split the single generated string into an array of captions.
    const rawCaptions = output!.captions;
    const captionsArray = (rawCaptions as any as string).split('\n').map((caption: string) => {
      const trimmedCaption = caption.replace(/^\d+\.\s*/, '').trim();
      return trimmedCaption;
    });

    return {
      captions: captionsArray.filter(caption => caption !== ''),
    };
  }
);
