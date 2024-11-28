// src/utils/marketData.js

export const fetchMarketData = async () => {
  try {
    // Use relative path - Vercel will handle this correctly
    const response = await fetch('/api/market-data');
    if (!response.ok) {
      throw new Error('Failed to fetch market data');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching market data:', error);
    throw error;
  }
};