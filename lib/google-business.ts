import { google } from "googleapis";

// Google Business API configuration
const GOOGLE_BUSINESS_SCOPES = [
  "https://www.googleapis.com/auth/business.manage",
  "https://www.googleapis.com/auth/plus.business.manage",
];

export class GoogleBusinessAPI {
  private auth: any;
  private businessService: any;

  constructor(accessToken?: string) {
    this.auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    if (accessToken) {
      this.auth.setCredentials({ access_token: accessToken });
    }

    this.businessService = google.mybusinessbusinessinformation({
      version: "v1",
      auth: this.auth,
    });
  }

  // Get authorization URL for OAuth2
  getAuthUrl(): string {
    return this.auth.generateAuthUrl({
      access_type: "offline",
      scope: GOOGLE_BUSINESS_SCOPES,
      prompt: "consent",
    });
  }

  // Exchange authorization code for tokens
  async getTokens(code: string) {
    const { tokens } = await this.auth.getToken(code);
    this.auth.setCredentials(tokens);
    return tokens;
  }

  // Get user's business accounts
  async getBusinessAccounts() {
    try {
      const response = await this.businessService.accounts.list();
      return response.data.accounts || [];
    } catch (error) {
      console.error("Error fetching business accounts:", error);
      throw new Error("Failed to fetch business accounts");
    }
  }

  // Get locations for a business account
  async getLocations(accountId: string) {
    try {
      const response = await this.businessService.accounts.locations.list({
        parent: `accounts/${accountId}`,
      });
      return response.data.locations || [];
    } catch (error) {
      console.error("Error fetching locations:", error);
      throw new Error("Failed to fetch business locations");
    }
  }

  // Update business hours
  async updateHours(locationId: string, hours: any) {
    try {
      const response = await this.businessService.accounts.locations.patch({
        name: locationId,
        requestBody: {
          regularHours: {
            periods: this.formatHoursForGoogle(hours),
          },
        },
        updateMask: "regularHours",
      });
      return response.data;
    } catch (error) {
      console.error("Error updating hours:", error);
      throw new Error("Failed to update business hours");
    }
  }

  // Update contact information
  async updateContact(locationId: string, contact: any) {
    try {
      const response = await this.businessService.accounts.locations.patch({
        name: locationId,
        requestBody: {
          phoneNumbers: {
            primaryPhone: contact.phone,
          },
          websiteUri: contact.website,
          serviceArea: {
            businessType: "RESTAURANT",
          },
        },
        updateMask: "phoneNumbers,websiteUri,serviceArea",
      });
      return response.data;
    } catch (error) {
      console.error("Error updating contact:", error);
      throw new Error("Failed to update contact information");
    }
  }

  // Update business description
  async updateDescription(locationId: string, description: string) {
    try {
      const response = await this.businessService.accounts.locations.patch({
        name: locationId,
        requestBody: {
          title: description,
        },
        updateMask: "title",
      });
      return response.data;
    } catch (error) {
      console.error("Error updating description:", error);
      throw new Error("Failed to update business description");
    }
  }

  // Get reviews (requires separate Reviews API)
  // Note: This function is temporarily disabled due to API structure changes
  async getReviews(locationId: string) {
    throw new Error(
      "Reviews API is not currently available - API structure has changed"
    );
  }

  // Reply to a review
  // Note: This function is temporarily disabled due to API structure changes
  async replyToReview(reviewId: string, reply: string) {
    throw new Error(
      "Reviews API is not currently available - API structure has changed"
    );
  }

  // Upload business photo
  async uploadPhoto(
    locationId: string,
    photo: File,
    category: string = "FOOD_AND_DRINK"
  ) {
    try {
      const response =
        await this.businessService.accounts.locations.media.create({
          parent: locationId,
          requestBody: {
            mediaFormat: "PHOTO",
            locationAssociation: {
              category: category,
            },
          },
          media: {
            mimeType: photo.type,
            body: photo,
          },
        });
      return response.data;
    } catch (error) {
      console.error("Error uploading photo:", error);
      throw new Error("Failed to upload photo");
    }
  }

  // Get business insights
  async getInsights(locationId: string, metrics: string[]) {
    try {
      const insightsService = google.mybusinessaccountmanagement({
        version: "v1",
        auth: this.auth,
      });

      // Note: Insights API structure has changed
      throw new Error(
        "Insights API is not currently available - API structure has changed"
      );
    } catch (error) {
      console.error("Error fetching insights:", error);
      throw new Error("Failed to fetch business insights");
    }
  }

  // Helper: Format hours for Google API
  private formatHoursForGoogle(hours: any) {
    const days = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const googleDays = [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ];

    return days
      .map((day, index) => {
        const dayHours = hours[day];
        if (!dayHours || !dayHours.open || !dayHours.close) {
          return null;
        }

        return {
          openDay: googleDays[index],
          openTime: {
            hours: parseInt(dayHours.open.split(":")[0]),
            minutes: parseInt(dayHours.open.split(":")[1]),
          },
          closeDay: googleDays[index],
          closeTime: {
            hours: parseInt(dayHours.close.split(":")[0]),
            minutes: parseInt(dayHours.close.split(":")[1]),
          },
        };
      })
      .filter(Boolean);
  }
}

// Singleton instance
export const googleBusiness = new GoogleBusinessAPI();
