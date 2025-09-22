import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getSlidesClient, hasCredentials } from "./googleAuth";

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
  execute: async ({ context }) => {
    const { presentationId, includeMetadata } = context;

    // Check if credentials are available
    if (!(await hasCredentials())) {
      throw new Error(
        "Google credentials not found. Please place your OAuth 2.0 credentials file as 'credentials.json' in the project root. " +
        "Get credentials from Google Cloud Console > APIs & Services > Credentials."
      );
    }

    try {
      const slides = await getSlidesClient();

      // Get the presentation metadata (includes slide count)
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
        if (error.message.includes('credentials not found')) {
          throw error;
        }
      }

      console.error('Google Slides API error:', error);
      throw new Error(`Failed to get slide count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});