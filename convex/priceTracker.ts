import { action } from './_generated/server';
import { internal } from './_generated/api';

export const trackPrices = action({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.runQuery(internal.products.getTracked);
    const today = new Date().toISOString().split('T')[0];
    
    await Promise.all(products.map(async (product) => {
      const currentPrice = await fetchAmazonPrice(product.url);
      const priceDrop = ((product.currentPrice - currentPrice) / product.currentPrice) * 100;
      
      if (priceDrop >= 10) {
        const sentToday = await ctx.runQuery(internal.notifications.countToday, {
          userId: product.userId
        });
        
        if (sentToday < 3) {
          await ctx.runMutation(internal.products.updatePrice, {
            id: product._id,
            price: currentPrice
          });
          
          await ctx.runAction(internal.resend.sendPriceAlert, {
            userId: product.userId,
            productId: product._id,
            oldPrice: product.currentPrice,
            newPrice: currentPrice
          });
        }
      }
    }));
  }
});

async function fetchAmazonPrice(url: string): Promise<number> {
  // Implementation using Amazon API or scraping
}