import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getUserId } from "../../lib/user-context";
import { getSlidesClient } from "./googleAuth";

export const getSlideCount = createTool({
  id: "get-slide-count",
  description: "Get the total number of slides in a Google Slides presentation. Requires OAuth authentication with Google.",
  inputSchema: z.object({
    presentationId: z.string().describe("The ID of the Google Slides presentation (found in the URL)"),
    includeMetadata: z.boolean().default(false).describe("Whether to include additional presentation metadata"),
  }),
  outputSchema: z.object({
    slideCount: z.number(),
    presentationId: z.string(),
    presentationTitle: z.string().optional(),
    presentationUrl: z.string().optional(),
    metadata: z.object({
      pageSize: z.object({
        height: z.object({ magnitude: z.number(), unit: z.string() }).optional(),
        width: z.object({ magnitude: z.number(), unit: z.string() }).optional(),
      }).optional(),
      locale: z.string().optional(),
      revisionId: z.string().optional(),
    }).optional(),
  }),
  execute: async (inputData, context) => {
    const { presentationId, includeMetadata } = inputData;

    // Get userId from global context set by custom endpoint
    const userId = getUserId();

    console.log(`[getSlideCount] Starting - presentationId: ${presentationId}, userId: ${userId}`);

    // Helper function to fetch presentation metadata
    const fetchPresentationData = async () => {
      console.log(`[getSlideCount] Getting slides client for user ${userId}...`);
      const slides = await getSlidesClient(userId);

      console.log(`[getSlideCount] Fetching presentation metadata...`);
      const presentationResponse = await slides.presentations.get({
        presentationId: presentationId,
      });

      const presentation = presentationResponse.data;

      if (!presentation) {
        throw new Error("Could not retrieve presentation data");
      }

      const slideCount = presentation.slides?.length || 0;

      // Build the response
      const response: any = {
        slideCount,
        presentationId,
        presentationTitle: presentation.title,
        presentationUrl: `https://docs.google.com/presentation/d/${presentationId}/edit`,
      };

      // Include additional metadata if requested
      if (includeMetadata) {
        response.metadata = {
          pageSize: presentation.pageSize ? {
            height: presentation.pageSize.height,
            width: presentation.pageSize.width,
          } : undefined,
          locale: presentation.locale,
          revisionId: presentation.revisionId,
        };
      }

      return response;
    };

    try {
      const result = await fetchPresentationData();
      console.log(`[getSlideCount] Successfully retrieved count: ${result.slideCount} slides`);
      return result;

    } catch (error) {
      console.error('[getSlideCount] Error occurred:', error);

      if (error instanceof Error) {
        // Handle token expiration - retry with fresh token
        if (error.message.includes('401') || error.message.includes('invalid_grant')) {
          console.log('[getSlideCount] Token expired, retrying with fresh token...');

          try {
            // Call getSlidesClient again - it fetches a fresh token from backend
            const result = await fetchPresentationData();
            console.log(`[getSlideCount] Successfully retrieved count after token refresh: ${result.slideCount} slides`);
            return result;
          } catch (retryError) {
            const errorMsg = `Authentication failed after retry: ${retryError instanceof Error ? retryError.message : String(retryError)}`;
            console.error(`[getSlideCount] ${errorMsg}`);
            throw new Error(errorMsg);
          }
        }

        // Handle specific Google API errors
        if (error.message.includes('404')) {
          const errorMsg = `Presentation not found with ID: ${presentationId}. Make sure the ID is correct and the presentation is accessible.`;
          console.error(`[getSlideCount] ${errorMsg}`);
          throw new Error(errorMsg);
        }
        if (error.message.includes('403')) {
          const errorMsg = `Access denied to presentation ${presentationId}. Make sure you have permission to view this presentation.`;
          console.error(`[getSlideCount] ${errorMsg}`);
          throw new Error(errorMsg);
        }

        // Re-throw user-friendly errors
        if (error.message.includes('Could not retrieve presentation data')) {
          console.error(`[getSlideCount] Re-throwing user-friendly error: ${error.message}`);
          throw error;
        }

        // For any other error, provide the actual error message
        const errorMsg = `Failed to get slide count: ${error.message}`;
        console.error(`[getSlideCount] ${errorMsg}`);
        throw new Error(errorMsg);
      }

      // If it's not an Error instance, still provide details
      const errorMsg = `Failed to get slide count: ${String(error)}`;
      console.error(`[getSlideCount] ${errorMsg}`);
      throw new Error(errorMsg);
    }
  },
});