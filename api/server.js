const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

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

app.get('/api/market-data', async (req, res) => {
  try {
    const marketData = {};
    const today = new Date().toISOString().split('T')[0];

    // Process symbols one at a time with delay to avoid rate limiting
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

        if (!response.data?.chart?.result?.[0]) {
          throw new Error(`Invalid data structure for ${symbol}`);
        }

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
          marketData[symbol] = {
            [today]: returnPct
          };
          console.log(`${symbol}: ${returnPct.toFixed(2)}% (${prevValidPrice} -> ${lastValidPrice})`);
        } else {
          console.log(`Warning: Insufficient valid prices for ${symbol}`);
          marketData[symbol] = {
            [today]: 0
          };
        }

        // Add delay between requests
        await sleep(100);

      } catch (error) {
        console.error(`Error fetching ${symbol}:`, error.message);
        marketData[symbol] = {
          [today]: 0
        };
      }
    }

    console.log('Final market data:', JSON.stringify(marketData, null, 2));
    res.json(marketData);

  } catch (error) {
    console.error('Error in main request handler:', error);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

