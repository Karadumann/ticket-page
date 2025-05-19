import { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton, Drawer, List, ListItem, ListItemText, useMediaQuery, Avatar, ListItemButton } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { styled, useTheme } from '@mui/material/styles';

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Login', path: '/login' },
  { label: 'Register', path: '/register' },
  { label: 'My Tickets', path: '/tickets' },
];

const GradientAppBar = styled(AppBar)(() => ({
  background: 'linear-gradient(90deg, #18181c 0%, #ff9100 100%)',
  boxShadow: '0 4px 24px 0 rgba(255,145,0,0.10)',
  transition: 'background 0.3s, box-shadow 0.3s',
}));

const GlowLogo = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: 56,
  height: 56,
  marginRight: theme.spacing(2),
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: 0,
    borderRadius: '16px',
    background: 'linear-gradient(90deg, #ff9100 0%, #ffb300 100%)',
    filter: 'blur(12px)',
    opacity: 0.6,
    zIndex: 0,
    transition: 'opacity 0.3s',
  },
}));

const GradientText = styled('span')({
  background: 'linear-gradient(90deg, #ff9100 0%, #ffb300 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  fontWeight: 900,
  letterSpacing: 2,
  textTransform: 'uppercase',
  fontFamily: 'Cinzel, Segoe UI, Arial, sans-serif',
  fontSize: 28,
});

export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <GradientAppBar
      position="fixed"
      elevation={isScrolled ? 8 : 4}
      sx={{
        background: isScrolled
          ? 'linear-gradient(90deg, #18181c 0%, #ff9100 100%)'
          : 'linear-gradient(90deg, #23232b 0%, #ff9100 100%)',
        boxShadow: isScrolled
          ? '0 8px 32px 0 rgba(255,145,0,0.18)'
          : '0 4px 24px 0 rgba(255,145,0,0.10)',
        transition: 'background 0.3s, box-shadow 0.3s',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1300,
      }}
    >
      <Toolbar sx={{ justifyContent: 'center', minHeight: 80, width: '100%' }}>
        <Box display="flex" alignItems="center" justifyContent="center" sx={{ flex: 1, maxWidth: 1200 }}>
          <Box display="flex" flexDirection="column" alignItems="center" flex={1}>
            <Box display="flex" alignItems="center" component={RouterLink} to="/" sx={{ textDecoration: 'none', mb: 1 }}>
              <GlowLogo>
                <Avatar
                  src="https://eucdn.west.laniatus.com/official/2025-NEW-ART/PLAYM2M_LOGO_REVEAL_NOBG_V2.webp"
                  alt="PlayM2M Logo"
                  sx={{ width: 48, height: 48, zIndex: 1, background: '#23232b' }}
                />
              </GlowLogo>
              <Box display="flex" flexDirection="column" alignItems="center">
                <GradientText>PLAYM2M</GradientText>
                <Typography variant="caption" sx={{ color: '#ffb300', fontWeight: 600, letterSpacing: 1, fontFamily: 'Cinzel, Segoe UI, Arial, sans-serif' }}>
                  MMORPG UNIVERSE
                </Typography>
              </Box>
            </Box>
            {/* Navigation under logo/title: only for mobile */}
            {isMobile && (
              <Box display="flex" alignItems="center" justifyContent="center" sx={{ mt: 1 }}>
                {navLinks.map(link => (
                  <Button
                    key={link.path}
                    color={location.pathname === link.path ? 'primary' : 'inherit'}
                    component={RouterLink}
                    to={link.path}
                    sx={{
                      mx: 2,
                      fontWeight: 700,
                      fontSize: 22,
                      letterSpacing: 1.5,
                      borderBottom: location.pathname === link.path ? '3px solid #ff9100' : 'none',
                      borderRadius: 0,
                      backgroundColor: 'transparent',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: 'transparent',
                        color: '#ff9100',
                        borderBottom: '3px solid #ff9100',
                        fontSize: 24,
                      },
                    }}
                  >
                    {link.label}
                  </Button>
                ))}
              </Box>
            )}
          </Box>
          {isMobile ? (
            <>
              <IconButton color="primary" onClick={() => setDrawerOpen(true)}>
                <MenuIcon fontSize="large" />
              </IconButton>
              <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
                <Box sx={{ width: 220, mt: 4 }}>
                  <List>
                    {navLinks.map(link => (
                      <ListItem key={link.path} disablePadding>
                        <ListItemButton
                          component={RouterLink}
                          to={link.path}
                          selected={location.pathname === link.path}
                          onClick={() => setDrawerOpen(false)}
                          sx={{
                            '&.Mui-selected, &.Mui-selected:hover': {
                              backgroundColor: 'transparent',
                              color: '#ff9100',
                            },
                            '&:hover': {
                              backgroundColor: 'transparent',
                              color: '#ff9100',
                            },
                          }}
                        >
                          <ListItemText primary={link.label} primaryTypographyProps={{ fontWeight: 600, fontSize: 18 }} />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Drawer>
            </>
          ) : (
            <Box display="flex" alignItems="center" justifyContent="center">
              {navLinks.map(link => (
                <Button
                  key={link.path}
                  color={location.pathname === link.path ? 'primary' : 'inherit'}
                  component={RouterLink}
                  to={link.path}
                  sx={{
                    mx: 1,
                    fontWeight: 600,
                    fontSize: 18,
                    borderBottom: location.pathname === link.path ? '2px solid #ff9100' : 'none',
                    borderRadius: 0,
                    backgroundColor: 'transparent',
                    '&:hover': {
                      backgroundColor: 'transparent',
                      color: '#ff9100',
                      borderBottom: '2px solid #ff9100',
                    },
                  }}
                >
                  {link.label}
                </Button>
              ))}
            </Box>
          )}
        </Box>
      </Toolbar>
    </GradientAppBar>
  );
} 