// convex/queries/products.ts
import { internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

// أنواع تصنيفات المنتجات
const productCategories = v.union(
  v.literal("donation"),
  v.literal("subscription"),
  v.literal("digital"),
  v.literal("physical"),
  v.literal("service")
);

// حالة المنتج
const productStatus = v.union(
  v.literal("active"),
  v.literal("draft"),
  v.literal("archived"),
  v.literal("out_of_stock")
);

export const getProductById = internalQuery({
  args: {
    productId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const product = await ctx.db.get(args.productId);
      if (!product) {
        throw new Error("Product not found");
      }
      return product;
    } catch (error) {
      await ctx.runAction(internal.errorHandling.handleError, {
        error,
        context: {
          module: "products",
          action: "getProductById",
          metadata: {
            productId: args.productId,
          },
        },
      });
      throw error;
    }
  },
});

export const getProductsByCategory = internalQuery({
  args: {
    category: productCategories,
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      let query = ctx.db
        .query("products")
        .filter((q) => q.eq(q.field("category"), args.category))
        .filter((q) => q.eq(q.field("status"), "active"));

      if (args.limit) {
        return await query.take(args.limit);
      }
      return await query.collect();
    } catch (error) {
      await ctx.runAction(internal.errorHandling.handleError, {
        error,
        context: {
          module: "products",
          action: "getProductsByCategory",
          metadata: {
            category: args.category,
          },
        },
      });
      throw error;
    }
  },
});

export const getFeaturedProducts = internalQuery({
  args: {
    limit: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      return await ctx.db
        .query("products")
        .filter((q) => q.eq(q.field("isFeatured"), true))
        .filter((q) => q.eq(q.field("status"), "active"))
        .order("desc")
        .take(args.limit);
    } catch (error) {
      await ctx.runAction(internal.errorHandling.handleError, {
        error,
        context: {
          module: "products",
          action: "getFeaturedProducts",
        },
      });
      throw error;
    }
  },
});

export const searchProducts = internalQuery({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const searchTerms = args.query.toLowerCase().split(" ");
      let query = ctx.db
        .query("products")
        .filter((q) => q.eq(q.field("status"), "active"));

      if (args.limit) {
        query = query.take(args.limit);
      }

      const allProducts = await query.collect();

      return allProducts.filter((product) => {
        const productText = `
          ${product.name.toLowerCase()} 
          ${product.description.toLowerCase()} 
          ${product.tags.join(" ").toLowerCase()}
        `;
        return searchTerms.some(term => productText.includes(term));
      });
    } catch (error) {
      await ctx.runAction(internal.errorHandling.handleError, {
        error,
        context: {
          module: "products",
          action: "searchProducts",
          metadata: {
            query: args.query,
          },
        },
      });
      throw error;
    }
  },
});

export const getRelatedProducts = internalQuery({
  args: {
    productId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const product = await ctx.db.get(args.productId);
      if (!product) {
        throw new Error("Product not found");
      }

      return await ctx.db
        .query("products")
        .filter((q) => q.eq(q.field("category"), product.category))
        .filter((q) => q.neq(q.field("_id"), product._id))
        .filter((q) => q.eq(q.field("status"), "active"))
        .take(args.limit || 4);
    } catch (error) {
      await ctx.runAction(internal.errorHandling.handleError, {
        error,
        context: {
          module: "products",
          action: "getRelatedProducts",
          metadata: {
            productId: args.productId,
          },
        },
      });
      throw error;
    }
  },
});

export const getProductsForDashboard = internalQuery({
  args: {
    status: v.optional(productStatus),
    category: v.optional(productCategories),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      let query = ctx.db.query("products");

      if (args.status) {
        query = query.filter((q) => q.eq(q.field("status"), args.status));
      }

      if (args.category) {
        query = query.filter((q) => q.eq(q.field("category"), args.category));
      }

      if (args.limit) {
        return await query.order("desc").take(args.limit);
      }

      return await query.order("desc").collect();
    } catch (error) {
      await ctx.runAction(internal.errorHandling.handleError, {
        error,
        context: {
          module: "products",
          action: "getProductsForDashboard",
        },
      });
      throw error;
    }
  },
});

export const productsQueries = {
  getProductById,
  getProductsByCategory,
  getFeaturedProducts,
  searchProducts,
  getRelatedProducts,
  getProductsForDashboard,
};