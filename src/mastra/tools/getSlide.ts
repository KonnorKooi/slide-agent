import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getSlidesClient, hasCredentials } from "./googleAuth";

// Schema for slide element (simplified version of Google Slides API response)
const slideElementSchema = z.object({
  objectId: z.string().optional(),
  size: z.object({
    height: z.object({ magnitude: z.number(), unit: z.string() }).optional(),
    width: z.object({ magnitude: z.number(), unit: z.string() }).optional(),
  }).optional(),
  transform: z.object({
    scaleX: z.number().optional(),
    scaleY: z.number().optional(),
    translateX: z.number().optional(),
    translateY: z.number().optional(),
    unit: z.string().optional(),
  }).optional(),
  shape: z.object({
    shapeType: z.string().optional(),
    text: z.object({
      textElements: z.array(z.object({
        textRun: z.object({
          content: z.string().optional(),
        }).optional(),
      })).optional(),
    }).optional(),
  }).optional(),
  image: z.object({
    contentUrl: z.string().optional(),
    sourceUrl: z.string().optional(),
  }).optional(),
});

// Schema for a slide
const slideSchema = z.object({
  objectId: z.string(),
  pageElements: z.array(slideElementSchema).optional(),
  slideProperties: z.object({
    notesPage: z.object({
      objectId: z.string().optional(),
    }).optional(),
  }).optional(),
  layoutProperties: z.object({
    masterObjectId: z.string().optional(),
    displayName: z.string().optional(),
  }).optional(),
});

export const getSlide = createTool({
  id: "get-google-slide",
  description: "Retrieve a specific slide from a Google Slides presentation. Requires OAuth authentication with Google.",
  inputSchema: z.object({
    presentationId: z.string().describe("The ID of the Google Slides presentation (found in the URL)"),
    slideIndex: z.number().min(0).describe("The index of the slide to retrieve (0-based, where 0 is the first slide)"),
    includeContent: z.boolean().default(true).describe("Whether to include text content from the slide"),
  }),
  outputSchema: z.object({
    slide: slideSchema,
    slideNumber: z.number(),
    totalSlides: z.number(),
    presentationTitle: z.string().optional(),
    textContent: z.string().optional(),
    imageUrls: z.array(z.string()).optional(),
  }),
  execute: async ({ context }) => {
    const { presentationId, slideIndex, includeContent } = context;

    // Check if credentials are available
    if (!(await hasCredentials())) {
      throw new Error(
        "Google credentials not found. Please place your OAuth 2.0 credentials file as 'credentials.json' in the project root. " +
        "Get credentials from Google Cloud Console > APIs & Services > Credentials."
      );
    }

    try {
      const slides = await getSlidesClient();

      // Get the presentation to access slides
      const presentationResponse = await slides.presentations.get({
        presentationId: presentationId,
      });

      const presentation = presentationResponse.data;

      if (!presentation.slides || presentation.slides.length === 0) {
        throw new Error("No slides found in the presentation");
      }

      if (slideIndex >= presentation.slides.length) {
        throw new Error(
          `Slide index ${slideIndex} is out of range. Presentation has ${presentation.slides.length} slides (0-${presentation.slides.length - 1})`
        );
      }

      const slide = presentation.slides[slideIndex];

      if (!slide) {
        throw new Error(`Could not retrieve slide at index ${slideIndex}`);
      }

      // Extract text content if requested
      let textContent: string | undefined;
      let imageUrls: string[] = [];

      if (includeContent && slide.pageElements) {
        const textParts: string[] = [];

        for (const element of slide.pageElements) {
          // Extract text from shape elements
          if (element.shape?.text?.textElements) {
            for (const textElement of element.shape.text.textElements) {
              if (textElement.textRun?.content) {
                textParts.push(textElement.textRun.content);
              }
            }
          }

          // Extract image URLs
          if (element.image?.contentUrl) {
            imageUrls.push(element.image.contentUrl);
          }
          if (element.image?.sourceUrl) {
            imageUrls.push(element.image.sourceUrl);
          }
        }

        textContent = textParts.join(' ').trim();
      }

      return {
        slide: slide as z.infer<typeof slideSchema>,
        slideNumber: slideIndex + 1, // Human-readable slide number (1-based)
        totalSlides: presentation.slides.length,
        presentationTitle: presentation.title,
        textContent: textContent || undefined,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      };

    } catch (error) {
      if (error instanceof Error) {
        // Handle specific Google API errors
        if (error.message.includes('404')) {
          throw new Error(`Presentation not found with ID: ${presentationId}. Make sure the ID is correct and the presentation is accessible.`);
        }
        if (error.message.includes('403')) {
          throw new Error(`Access denied to presentation ${presentationId}. Make sure you have permission to view this presentation.`);
        }
        if (error.message.includes('401')) {
          throw new Error(`Authentication failed. Please re-authenticate with Google or check your credentials.`);
        }

        // Re-throw the original error if it's already user-friendly
        if (error.message.includes('out of range') || error.message.includes('credentials not found')) {
          throw error;
        }
      }

      console.error('Google Slides API error:', error);
      throw new Error(`Failed to retrieve slide: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});