// convex/queries/donations.ts
import { internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

// أنواع التبرعات
const donationTypes = v.union(
  v.literal("one-time"),
  v.literal("recurring"),
  v.literal("campaign")
);

// طرق الدفع
const paymentMethods = v.union(
  v.literal("credit_card"),
  v.literal("bitcoin"),
  v.literal("paypal"),
  v.literal("bank_transfer")
);

export const getDonationById = internalQuery({
  args: {
    donationId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const donation = await ctx.db.get(args.donationId);
      if (!donation) {
        throw new Error("Donation not found");
      }

      // جلب معلومات إضافية إذا كانت موجودة
      let product = null;
      if (donation.productId) {
        product = await ctx.db.get(donation.productId);
      }

      let user = null;
      if (donation.userId) {
        user = await ctx.db.get(donation.userId);
      }

      return {
        ...donation,
        product,
        user: user ? { name: user.name, email: user.email } : null,
      };
    } catch (error) {
      await ctx.runAction(internal.errorHandling.handleError, {
        error,
        context: {
          module: "donations",
          action: "getDonationById",
          metadata: {
            donationId: args.donationId,
          },
        },
      });
      throw error;
    }
  },
});

export const getUserDonations = internalQuery({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("completed"),
        v.literal("failed")
      )
    ),
  },
  handler: async (ctx, args) => {
    try {
      let query = ctx.db
        .query("donations")
        .filter((q) => q.eq(q.field("userId"), args.userId));

      if (args.status) {
        query = query.filter((q) => q.eq(q.field("status"), args.status));
      }

      if (args.limit) {
        return await query.order("desc").take(args.limit);
      }

      return await query.order("desc").collect();
    } catch (error) {
      await ctx.runAction(internal.errorHandling.handleError, {
        error,
        context: {
          module: "donations",
          action: "getUserDonations",
          metadata: {
            userId: args.userId,
          },
        },
      });
      throw error;
    }
  },
});

export const getRecentDonations = internalQuery({
  args: {
    limit: v.number(),
    includeUserInfo: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    try {
      const donations = await ctx.db
        .query("donations")
        .order("desc")
        .take(args.limit);

      if (!args.includeUserInfo) {
        return donations;
      }

      // جلب معلومات المستخدمين إذا مطلوب
      return await Promise.all(
        donations.map(async (donation) => {
          if (!donation.userId) return donation;
          
          const user = await ctx.db.get(donation.userId);
          return {
            ...donation,
            user: user ? { name: user.name, email: user.email } : null,
          };
        })
      );
    } catch (error) {
      await ctx.runAction(internal.errorHandling.handleError, {
        error,
        context: {
          module: "donations",
          action: "getRecentDonations",
        },
      });
      throw error;
    }
  },
});

export const getDonationsByCampaign = internalQuery({
  args: {
    campaignId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      let query = ctx.db
        .query("donations")
        .filter((q) => q.eq(q.field("metadata.campaignId"), args.campaignId))
        .filter((q) => q.eq(q.field("status"), "completed"));

      if (args.limit) {
        return await query.order("desc").take(args.limit);
      }

      return await query.order("desc").collect();
    } catch (error) {
      await ctx.runAction(internal.errorHandling.handleError, {
        error,
        context: {
          module: "donations",
          action: "getDonationsByCampaign",
          metadata: {
            campaignId: args.campaignId,
          },
        },
      });
      throw error;
    }
  },
});

export const getDonationStats = internalQuery({
  args: {
    timeframe: v.union(
      v.literal("24h"),
      v.literal("7d"),
      v.literal("30d"),
      v.literal("all")
    ),
    campaignId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const now = Date.now();
      let cutoff = 0;

      switch (args.timeframe) {
        case "24h":
          cutoff = now - 24 * 60 * 60 * 1000;
          break;
        case "7d":
          cutoff = now - 7 * 24 * 60 * 60 * 1000;
          break;
        case "30d":
          cutoff = now - 30 * 24 * 60 * 60 * 1000;
          break;
        case "all":
          cutoff = 0;
          break;
      }

      let query = ctx.db.query("donations");

      if (cutoff > 0) {
        query = query.filter((q) => q.gte(q.field("createdAt"), cutoff));
      }

      if (args.campaignId) {
        query = query.filter((q) => q.eq(q.field("metadata.campaignId"), args.campaignId));
      }

      const donations = await query.collect();

      const completedDonations = donations.filter(
        (d) => d.status === "completed"
      );

      return {
        total: donations.length,
        completed: completedDonations.length,
        pending: donations.filter((d) => d.status === "pending").length,
        failed: donations.filter((d) => d.status === "failed").length,
        totalAmount: completedDonations.reduce(
          (sum, donation) => sum + donation.amount,
          0
        ),
        averageAmount:
          completedDonations.length > 0
            ? completedDonations.reduce(
                (sum, donation) => sum + donation.amount,
                0
              ) / completedDonations.length
            : 0,
        byMethod: {
          credit_card: completedDonations.filter(
            (d) => d.method === "credit_card"
          ).length,
          bitcoin: completedDonations.filter(
            (d) => d.method === "bitcoin"
          ).length,
          paypal: completedDonations.filter(
            (d) => d.method === "paypal"
          ).length,
          bank_transfer: completedDonations.filter(
            (d) => d.method === "bank_transfer"
          ).length,
        },
        byCurrency: {
          USD: completedDonations.filter((d) => d.currency === "USD").length,
          EUR: completedDonations.filter((d) => d.currency === "EUR").length,
          BTC: completedDonations.filter((d) => d.currency === "BTC").length,
        },
      };
    } catch (error) {
      await ctx.runAction(internal.errorHandling.handleError, {
        error,
        context: {
          module: "donations",
          action: "getDonationStats",
          metadata: {
            timeframe: args.timeframe,
            campaignId: args.campaignId,
          },
        },
      });
      throw error;
    }
  },
});

export const donationsQueries = {
  getDonationById,
  getUserDonations,
  getRecentDonations,
  getDonationsByCampaign,
  getDonationStats,
};