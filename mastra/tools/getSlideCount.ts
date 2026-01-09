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
    // Extract parameters from inputData.context (Mastra v1 beta structure)
    const { presentationId, includeMetadata } = inputData.context || inputData;

    // Get userId from global context set by custom endpoint
    const userId = getUserId();

    if (!presentationId) {
      throw new Error('Missing required parameters: presentationId');
    }

    const fetchPresentationData = async () => {
      const slides = await getSlidesClient(userId);

      const presentationResponse = await slides.presentations.get({
        presentationId: presentationId,
      });

      const presentation = presentationResponse.data;

      if (!presentation) {
        throw new Error("Could not retrieve presentation data");
      }

      const slideCount = presentation.slides?.length || 0;

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
      return await fetchPresentationData();
    } catch (error) {
      if (error instanceof Error) {
        // Handle token expiration - retry with fresh token
        if (error.message.includes('401') || error.message.includes('invalid_grant')) {
          try {
            return await fetchPresentationData();
          } catch (retryError) {
            throw new Error(`Authentication failed after retry: ${retryError instanceof Error ? retryError.message : String(retryError)}`);
          }
        }

        // Handle specific Google API errors
        if (error.message.includes('404')) {
          throw new Error(`Presentation not found with ID: ${presentationId}. Make sure the ID is correct and the presentation is accessible.`);
        }
        if (error.message.includes('403')) {
          throw new Error(`Access denied to presentation ${presentationId}. Make sure you have permission to view this presentation.`);
        }

        if (error.message.includes('Could not retrieve presentation data')) {
          throw error;
        }

        throw new Error(`Failed to get slide count: ${error.message}`);
      }

      throw new Error(`Failed to get slide count: ${String(error)}`);
    }
  },
});