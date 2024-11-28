// api/market-data.js
import axios from 'axios';

const SYMBOLS = [
  'SPY',        // S&P 500 ETF
  'QQQ',        // NASDAQ ETF
  'GLD',        // Gold ETF
  'TLT',        // 20+ Year Treasury Bond ETF
  'VIX',        // Volatility Index
  'BTC-USD',    // Bitcoin
  'HG=F',       // Copper Futures
  'AUDJPY=X'    // AUD/JPY exchange rate
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default async function handler(req, res) {
  try {
    const marketData = {};

    for (const symbol of SYMBOLS) {
      try {
        const querySymbol = symbol === 'VIX' ? '^VIX' : symbol;
        console.log(`Fetching data for ${querySymbol}...`);
        
        const response = await axios.get(
          `https://query1.finance.yahoo.com/v8/finance/chart/${querySymbol}?range=2d&interval=1d`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': 'application/json',
            }
          }
        );

        const result = response.data.chart.result[0];
        const timestamps = result.timestamp;
        const quotes = result.indicators.quote[0];
        const closes = quotes.close;

        // Get last two valid prices
        let lastValidPrice = null;
        let prevValidPrice = null;

        for (let i = closes.length - 1; i >= 0; i--) {
          if (closes[i] !== null) {
            if (lastValidPrice === null) {
              lastValidPrice = closes[i];
            } else if (prevValidPrice === null) {
              prevValidPrice = closes[i];
              break;
            }
          }
        }

        if (lastValidPrice !== null && prevValidPrice !== null) {
          const returnPct = ((lastValidPrice - prevValidPrice) / prevValidPrice) * 100;
          const date = new Date(timestamps[timestamps.length - 1] * 1000).toISOString().split('T')[0];
          marketData[symbol] = {
            [date]: returnPct
          };
          console.log(`${symbol} - Return: ${returnPct.toFixed(2)}% (${prevValidPrice} -> ${lastValidPrice})`);
        }

        // Add delay between requests
        await sleep(100);

      } catch (error) {
        console.error(`Error fetching ${symbol}:`, error.message);
        const date = new Date().toISOString().split('T')[0];
        marketData[symbol] = {
          [date]: 0
        };
      }
    }

    res.status(200).json(marketData);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
}