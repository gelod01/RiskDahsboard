import axios from 'axios';

const SYMBOLS = [
  'SPY', 'QQQ', 'GLD', 'TLT', 'VIX', 'BTC-USD', 'HG=F', 'AUDJPY=X'
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default async function handler(req, res) {
  try {
    const marketData = {};
    const today = new Date().toISOString().split('T')[0];

    for (const symbol of SYMBOLS) {
      try {
        const querySymbol = symbol === 'VIX' ? '^VIX' : symbol;
        const response = await axios.get(
          `https://query1.finance.yahoo.com/v8/finance/chart/${querySymbol}?range=2d&interval=1d`
        );

        if (!response.data?.chart?.result?.[0]) {
          throw new Error(`Invalid data structure for ${symbol}`);
        }

        const result = response.data.chart.result[0];
        const closes = result.indicators.quote[0]?.close || [];

        const lastValidPrice = closes.reverse().find((price) => price !== null) || 0;
        const prevValidPrice = closes.find((price) => price !== null && price !== lastValidPrice) || 0;

        const returnPct = prevValidPrice ? ((lastValidPrice - prevValidPrice) / prevValidPrice) * 100 : 0;
        marketData[symbol] = { [today]: returnPct };
        await sleep(100); // Delay to avoid rate-limiting
      } catch (err) {
        console.error(`Error fetching ${symbol}:`, err.message);
        marketData[symbol] = { [today]: 0 };
      }
    }

    res.status(200).json(marketData);
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
}
