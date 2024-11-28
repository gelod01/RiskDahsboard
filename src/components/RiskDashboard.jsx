import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Percent } from 'lucide-react';
import { fetchMarketData } from '../utils/marketData';
import { processMarketData } from '../utils/riskMetrics';

const RiskDashboard = () => {
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await fetchMarketData();
        const processed = processMarketData(data);
        setMarketData(processed);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full">
        <div className="text-lg text-gray-600">Loading market data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen w-full">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  const { riskScore, indicators, history, hourlyHistory } = marketData;

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-emerald-500';
    if (score <= 30) return 'text-rose-500';
    return 'text-amber-500';
  };

  const getScoreBg = (score) => {
    if (score >= 70) return 'bg-emerald-50';
    if (score <= 30) return 'bg-rose-50';
    return 'bg-amber-50';
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-lg">
          <p className="text-sm font-medium">Score: {payload[0].value.toFixed(1)}</p>
          {payload[0].payload.date && (
            <p className="text-xs text-gray-500">{new Date(payload[0].payload.date).toLocaleDateString()}</p>
          )}
        </div>
      );
    }
    return null;
  };

  const hourlyData = hourlyHistory.map(item => ({
    hour: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    score: item.score
  }));

  return (
    <div className="h-full w-full p-6">
      <div className="w-full max-w-[2000px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Risk Dashboard</h1>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {/* Main Risk Score and Today's History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Main Risk Score */}
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
            <div className="space-y-6">
              <div className="flex justify-between items-baseline">
                <h2 className="text-lg font-semibold text-gray-700">Current Risk Score</h2>
                <span className="text-sm text-gray-500">Real-time</span>
              </div>
              <div className="flex items-center space-x-6">
                <div className={`text-7xl font-bold ${getScoreColor(riskScore || 50)}`}>
                  {(riskScore || 50).toFixed(1)}
                </div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-500 bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500"
                      style={{ width: `${isNaN(riskScore) ? 50 : riskScore}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>Risk Off</span>
                    <span>Risk On</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Score History
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
            <div className="space-y-4">
              <div className="flex justify-between items-baseline">
                <h2 className="text-lg font-semibold text-gray-700">Today's Score History</h2>
                <span className="text-sm text-gray-500">Hourly</span>
              </div>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="hour" stroke="#9ca3af" fontSize={12} />
                    <YAxis domain={[0, 100]} stroke="#9ca3af" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#6366f1" 
                      strokeWidth={2}
                      dot={{ stroke: '#6366f1', strokeWidth: 2, r: 4, fill: '#fff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div> */}
        </div>

        {/* Constituents Grid */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 mb-6">
          <div className="space-y-6">
            <div className="flex justify-between items-baseline">
              <h2 className="text-lg font-semibold text-gray-700">Constituents</h2>
              <span className="text-sm text-gray-500">Live Data</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {indicators.filter(item => !isNaN(item.value)).map((item) => (
                <div 
                  key={item.symbol} 
                  className={`p-4 rounded-lg border transition-all duration-200 ${getScoreBg(item.value)}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">{item.symbol}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center">
                      <span className={`${item.return >= 0 ? 'text-emerald-500' : 'text-rose-500'} flex items-center`}>
                        {Math.abs(item.return || 0).toFixed(2)}
                        <Percent size={14} className="ml-0.5" />
                        {(item.return || 0) >= 0 ? (
                          <ArrowUpRight size={16} className="ml-0.5" />
                        ) : (
                          <ArrowDownRight size={16} className="ml-0.5" />
                        )}
                      </span>
                    </div>
                    <span className={`font-bold ${getScoreColor(item.value)}`}>
                      {item.value.toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monthly History */}
        {/* <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
          <div className="space-y-4">
            <div className="flex justify-between items-baseline">
              <h2 className="text-lg font-semibold text-gray-700">Score History</h2>
              <span className="text-sm text-gray-500">Past 3 Months</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#9ca3af" 
                    fontSize={12}
                    tickFormatter={(date) => new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  />
                  <YAxis domain={[0, 100]} stroke="#9ca3af" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#6366f1" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default RiskDashboard;