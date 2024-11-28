export const fetchMarketData = async () => {
  try {
    const response = await fetch('/api/market-data'); // Vercel will handle this route
    if (!response.ok) {
      throw new Error('Failed to fetch market data');
    }
    return await response.json();
  } catch (err) {
    console.error('Error fetching market data:', err);
    throw err;
  }
};
