// src/utils/riskMetrics.js

const ASSET_WEIGHTS = {
  'SPY': 1.0,     // S&P 500 - major market indicator
  'QQQ': 0.8,     // NASDAQ - tech sector
  'GLD': 0.6,     // Gold - safe haven
  'TLT': 0.6,     // Treasury Bonds - safe haven
  'VIX': 1.2,     // Volatility Index - fear gauge
  'BTC-USD': 0.4, // Bitcoin - high volatility asset
  'HG=F': 0.7,    // Copper - economic indicator
  'AUDJPY=X': 0.8 // Risk currency pair
};

const normalizeToRiskScore = (percentChange) => {
  // Simple linear scaling: 
  // If change is positive, score will be > 50 (risk-on)
  // If change is negative, score will be < 50 (risk-off)
  return Math.min(Math.max(50 + (percentChange * 10), 0), 100);
};

export const processMarketData = (data) => {
  if (!data || Object.keys(data).length === 0) {
    return { riskScore: 50, indicators: [], history: [], hourlyHistory: [] };
  }

  // Process latest indicators
  const indicators = Object.entries(data).map(([symbol, returns]) => {
    const returnValue = Object.values(returns)[0] || 0;
    let value = normalizeToRiskScore(returnValue);
    
    // For VIX, invert the score (higher VIX = risk off)
    if (symbol === 'VIX') {
      value = 100 - value;
    }

    return {
      symbol,
      return: returnValue,
      value,
      weight: ASSET_WEIGHTS[symbol] || 1.0
    };
  });

  // Calculate weighted average score
  const totalWeight = indicators.reduce((sum, ind) => sum + ind.weight, 0);
  const riskScore = indicators.reduce((sum, ind) => sum + (ind.value * ind.weight), 0) / totalWeight;

  // Debug logging
  console.log('Raw returns and scores:');
  indicators.forEach(ind => {
    console.log(`${ind.symbol}: ${ind.return?.toFixed(2)}% -> ${ind.value?.toFixed(1)} (weight: ${ind.weight})`);
  });
  console.log('Final risk score:', riskScore.toFixed(1));

  return {
    riskScore,
    indicators,
    history: [], // We'll handle historical data separately if needed
    hourlyHistory: [{ timestamp: new Date().toISOString(), score: riskScore }]
  };
};