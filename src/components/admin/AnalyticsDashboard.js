import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Star as StarIcon,
  Map as MapIcon,
  Timeline as TimelineIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { db } from '../../firebaseConfig';
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import colors from '../../styles/colors';

const AnalyticsDashboard = ({ userType }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRatings: 0,
    totalCoffices: 0,
    averageRating: 0,
    recentActivity: 0,
    conversionRate: 0
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [topCoffices, setTopCoffices] = useState([]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Calculate date range
      const now = new Date();
      const timeRanges = {
        '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      };
      const startDate = timeRanges[timeRange];

      // Fetch users
      const usersQuery = query(collection(db, 'profiles'));
      const usersSnapshot = await getDocs(usersQuery);
      const totalUsers = usersSnapshot.size;

      // Fetch recent users
      const recentUsersQuery = query(
        collection(db, 'profiles'),
        where('createdAt', '>=', startDate.toISOString())
      );
      const recentUsersSnapshot = await getDocs(recentUsersQuery);
      const recentUsers = recentUsersSnapshot.size;

      // Fetch ratings
      const ratingsQuery = query(collection(db, 'ratings'));
      const ratingsSnapshot = await getDocs(ratingsQuery);
      const totalRatings = ratingsSnapshot.size;

      // Calculate average rating
      let totalRatingSum = 0;
      let ratingCount = 0;
      ratingsSnapshot.docs.forEach(doc => {
        const rating = doc.data();
        if (rating.wifi && rating.power && rating.coffee) {
          totalRatingSum += (rating.wifi + rating.power + rating.coffee) / 3;
          ratingCount++;
        }
      });
      const averageRating = ratingCount > 0 ? totalRatingSum / ratingCount : 0;

      // Fetch coffices
      const cofficesQuery = query(collection(db, 'coffices'));
      const cofficesSnapshot = await getDocs(cofficesQuery);
      const totalCoffices = cofficesSnapshot.size;

      // Get top coffices by rating
      const cofficesWithRatings = cofficesSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(coffice => coffice.averageRatings && coffice.totalRatings > 0)
        .sort((a, b) => {
          const avgA = (a.averageRatings.wifi + a.averageRatings.power + a.averageRatings.coffee) / 3;
          const avgB = (b.averageRatings.wifi + b.averageRatings.power + b.averageRatings.coffee) / 3;
          return avgB - avgA;
        })
        .slice(0, 5);

      // Calculate conversion rate (users who rated / total users)
      const conversionRate = totalUsers > 0 ? (ratingCount / totalUsers) * 100 : 0;

      setStats({
        totalUsers,
        totalRatings: ratingCount,
        totalCoffices,
        averageRating: averageRating.toFixed(1),
        recentActivity: recentUsers,
        conversionRate: conversionRate.toFixed(1)
      });

      setTopCoffices(cofficesWithRatings);

      // Get recent ratings for activity feed
      const recentRatings = ratingsSnapshot.docs
        .slice(0, 5)
        .map(doc => {
          const rating = doc.data();
          return {
            type: 'rating_submitted',
            user: rating.userId || 'Unknown',
            place: rating.placeName || 'Unknown',
            timestamp: new Date(rating.timestamp || Date.now())
          };
        });

      // Get recent user signups
      const recentUsers = usersSnapshot.docs
        .slice(0, 3)
        .map(doc => {
          const user = doc.data();
          return {
            type: 'user_signup',
            user: user.displayName || user.email || 'Unknown',
            timestamp: new Date(user.createdAt || Date.now())
          };
        });

      // Combine and sort by timestamp
      const allEvents = [...recentRatings, ...recentUsers]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5);

      setRecentEvents(allEvents);

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const getEventIcon = (type) => {
    switch (type) {
      case 'user_signup': return <PeopleIcon />;
      case 'rating_submitted': return <StarIcon />;
      case 'place_selected': return <MapIcon />;
      case 'search_initiated': return <TimelineIcon />;
      default: return <TimelineIcon />;
    }
  };

  const getEventColor = (type) => {
    switch (type) {
      case 'user_signup': return 'success';
      case 'rating_submitted': return 'primary';
      case 'place_selected': return 'info';
      case 'search_initiated': return 'warning';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Analytics Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
              size="small"
            >
              <MenuItem value="7d">Last 7 days</MenuItem>
              <MenuItem value="30d">Last 30 days</MenuItem>
              <MenuItem value="90d">Last 90 days</MenuItem>
            </Select>
          </FormControl>
          <IconButton 
            onClick={fetchAnalyticsData}
            disabled={loading}
            color="primary"
            title="Refresh data"
          >
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <PeopleIcon sx={{ color: colors.primary.main, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.totalUsers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <StarIcon sx={{ color: colors.primary.main, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.totalRatings}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Ratings
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <MapIcon sx={{ color: colors.primary.main, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.totalCoffices}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Coffices Listed
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingUpIcon sx={{ color: colors.primary.main, fontSize: 40 }} />
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.averageRating}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Rating
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Additional Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                User Engagement
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: colors.primary.main }}>
                    {stats.conversionRate}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Conversion Rate
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.recentActivity}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    New Users ({timeRange})
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Rated Coffices
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {topCoffices.slice(0, 3).map((coffice, index) => (
                  <Box key={coffice.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {index + 1}. {coffice.name}
                    </Typography>
                    <Chip 
                      label={`${((coffice.averageRatings.wifi + coffice.averageRatings.power + coffice.averageRatings.coffee) / 3).toFixed(1)}/5`}
                      size="small"
                      color="primary"
                    />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {recentEvents.map((event, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip
                      icon={getEventIcon(event.type)}
                      label={event.type.replace('_', ' ')}
                      color={getEventColor(event.type)}
                      size="small"
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2">
                        {event.user} {event.place && `- ${event.place}`} {event.query && `- "${event.query}"`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {event.timestamp.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Analytics Insights
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Note:</strong> This dashboard shows real-time data from Firestore. 
                  For detailed user journey analytics, check Firebase Analytics console.
                </Typography>
              </Alert>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Alert severity="info" icon={<TrendingUpIcon />}>
                  <Typography variant="body2">
                    <strong>User Growth:</strong> {stats.recentActivity} new users in the last {timeRange === '7d' ? 'week' : timeRange === '30d' ? 'month' : '3 months'}
                  </Typography>
                </Alert>
                <Alert severity="success" icon={<StarIcon />}>
                  <Typography variant="body2">
                    <strong>Engagement:</strong> {stats.conversionRate}% of users have submitted ratings
                  </Typography>
                </Alert>
                <Alert severity="warning" icon={<ErrorIcon />}>
                  <Typography variant="body2">
                    <strong>Quality:</strong> Average rating of {stats.averageRating}/5 across all coffices
                  </Typography>
                </Alert>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsDashboard;
