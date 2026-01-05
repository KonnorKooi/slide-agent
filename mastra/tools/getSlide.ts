import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getUserId } from "../../lib/user-context";
import { getSlidesClient } from "./googleAuth";

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
  execute: async (inputData, context) => {
    const { presentationId, slideIndex, includeContent } = inputData;

    // Get userId from global context set by custom endpoint
    const userId = getUserId();

    console.log(`[getSlide] Starting - presentationId: ${presentationId}, slideIndex: ${slideIndex}, userId: ${userId}`);

    // Helper function to fetch and process slide data
    const fetchSlideData = async () => {
      console.log(`[getSlide] Getting slides client for user ${userId}...`);
      const slides = await getSlidesClient(userId);

      console.log(`[getSlide] Fetching presentation...`);
      const presentationResponse = await slides.presentations.get({
        presentationId: presentationId,
      });

      const presentation = presentationResponse.data;
      console.log(`[getSlide] Presentation fetched, title: ${presentation.title}`);

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

      console.log(`[getSlide] Processing slide ${slideIndex + 1}/${presentation.slides.length}`);

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
        slideNumber: slideIndex + 1,
        totalSlides: presentation.slides.length,
        presentationTitle: presentation.title || undefined,
        textContent: textContent || undefined,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      };
    };

    try {
      const result = await fetchSlideData();
      console.log(`[getSlide] Successfully processed slide ${slideIndex + 1}`);
      return result;

    } catch (error) {
      console.error('[getSlide] Error occurred:', error);

      if (error instanceof Error) {
        // Handle token expiration - retry with fresh token
        if (error.message.includes('401') || error.message.includes('invalid_grant')) {
          console.log('[getSlide] Token expired, retrying with fresh token...');

          try {
            // Call getSlidesClient again - it fetches a fresh token from backend
            const result = await fetchSlideData();
            console.log(`[getSlide] Successfully processed slide ${slideIndex + 1} after token refresh`);
            return result;
          } catch (retryError) {
            const errorMsg = `Authentication failed after retry: ${retryError instanceof Error ? retryError.message : String(retryError)}`;
            console.error(`[getSlide] ${errorMsg}`);
            throw new Error(errorMsg);
          }
        }

        // Handle specific Google API errors
        if (error.message.includes('404')) {
          const errorMsg = `Presentation not found with ID: ${presentationId}. Make sure the ID is correct and the presentation is accessible.`;
          console.error(`[getSlide] ${errorMsg}`);
          throw new Error(errorMsg);
        }
        if (error.message.includes('403')) {
          const errorMsg = `Access denied to presentation ${presentationId}. Make sure you have permission to view this presentation.`;
          console.error(`[getSlide] ${errorMsg}`);
          throw new Error(errorMsg);
        }

        // Re-throw the original error if it's already user-friendly
        if (error.message.includes('out of range') || error.message.includes('No slides found')) {
          console.error(`[getSlide] Re-throwing user-friendly error: ${error.message}`);
          throw error;
        }

        // For any other error, provide the actual error message
        const errorMsg = `Failed to retrieve slide: ${error.message}`;
        console.error(`[getSlide] ${errorMsg}`);
        throw new Error(errorMsg);
      }

      // If it's not an Error instance, still provide details
      const errorMsg = `Failed to retrieve slide: ${String(error)}`;
      console.error(`[getSlide] ${errorMsg}`);
      throw new Error(errorMsg);
    }
  },
});