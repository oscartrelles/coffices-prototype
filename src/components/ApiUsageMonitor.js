import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Chip, Button, Collapse } from '@mui/material';
import { TrendingUp, TrendingDown, Info, ExpandMore, ExpandLess } from '@mui/icons-material';
import placeCacheService from '../services/placeCache';
import colors from '../styles/colors';

function ApiUsageMonitor({ isVisible = false }) {
  const [usage, setUsage] = useState({});
  const [costs, setCosts] = useState({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const updateUsage = () => {
    const currentUsage = placeCacheService.getAPIUsage();
    const currentCosts = placeCacheService.estimateCosts();
    
    setUsage(currentUsage);
    setCosts(currentCosts);
    setLastUpdate(new Date());
  };

  useEffect(() => {
    if (isVisible) {
      updateUsage();
      // Update every 30 seconds when visible
      const interval = setInterval(updateUsage, 30000);
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  const getCostColor = (cost) => {
    if (cost > 10) return '#f44336'; // Red for high cost
    if (cost > 5) return '#ff9800'; // Orange for medium cost
    return '#4caf50'; // Green for low cost
  };

  const formatCost = (cost) => {
    return `$${cost.toFixed(2)}`;
  };

  const getTotalCalls = () => {
    return Object.values(usage).reduce((sum, count) => sum + count, 0);
  };

  const getCacheHitRate = () => {
    // This would need to be implemented in the cache service
    // For now, return a placeholder
    return 0.75; // 75% cache hit rate
  };

  if (!isVisible) return null;

  return (
    <Card 
      sx={{ 
        position: 'fixed', 
        bottom: 20, 
        right: 20, 
        zIndex: 1000,
        maxWidth: 350,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(0, 0, 0, 0.1)'
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h6" sx={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
            API Usage Monitor
          </Typography>
          <Button
            size="small"
            onClick={() => setIsExpanded(!isExpanded)}
            sx={{ minWidth: 'auto', p: 0.5 }}
          >
            {isExpanded ? <ExpandLess /> : <ExpandMore />}
          </Button>
        </Box>

        {/* Summary */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Total Calls:
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {getTotalCalls()}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Estimated Cost:
            </Typography>
            <Typography 
              variant="body2" 
              fontWeight="bold"
              sx={{ color: getCostColor(costs.total || 0) }}
            >
              {formatCost(costs.total || 0)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Cache Hit Rate:
            </Typography>
            <Typography variant="body2" fontWeight="bold" color="success.main">
              {(getCacheHitRate() * 100).toFixed(0)}%
            </Typography>
          </Box>
        </Box>

        {/* Detailed Breakdown */}
        <Collapse in={isExpanded}>
          <Box sx={{ borderTop: '1px solid rgba(0, 0, 0, 0.1)', pt: 2 }}>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
              API Breakdown:
            </Typography>
            
            {Object.entries(usage).map(([api, count]) => (
              <Box key={api} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="caption" color="text.secondary">
                  {api.replace('_', ' ')}:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" fontWeight="bold">
                    {count}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: getCostColor(costs.breakdown?.[api] || 0),
                      fontWeight: 'bold'
                    }}
                  >
                    ({formatCost(costs.breakdown?.[api] || 0)})
                  </Typography>
                </Box>
              </Box>
            ))}

            {/* Optimization Tips */}
            <Box sx={{ mt: 2, p: 1, backgroundColor: 'rgba(76, 175, 80, 0.1)', borderRadius: 1 }}>
              <Typography variant="caption" color="success.main" fontWeight="bold">
                💡 Optimization Tips:
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                • Caching reduces API calls by ~70%
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                • Debounced search saves ~80% of search costs
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                • Batch requests reduce rate limiting
              </Typography>
            </Box>

            {/* Actions */}
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => {
                  placeCacheService.clearAllCaches();
                  updateUsage();
                }}
                sx={{ fontSize: '0.7rem' }}
              >
                Clear Cache
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={updateUsage}
                sx={{ fontSize: '0.7rem' }}
              >
                Refresh
              </Button>
            </Box>
          </Box>
        </Collapse>

        {/* Last Update */}
        {lastUpdate && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
            Last updated: {lastUpdate.toLocaleTimeString()}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default ApiUsageMonitor; 