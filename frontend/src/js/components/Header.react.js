import { Icon } from '@iconify/react';
import { Box } from '@material-ui/core';
import AppBar from '@material-ui/core/AppBar';
import IconButton from '@material-ui/core/IconButton';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import { makeStyles } from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import AccountCircle from '@material-ui/icons/AccountCircle';
import CreateOutlined from '@material-ui/icons/CreateOutlined';
import DOMPurify from 'dompurify';
import React from 'react';
import _ from 'underscore';
import API from '../api/API';
import nebraskaLogo from '../icons/nebraska-logo.json';

const useStyles = makeStyles(theme => ({
  title: {
    flexGrow: 1,
    display: 'none',
    color: theme.palette.titleColor,
    [theme.breakpoints.up('sm')]: {
      display: 'block',
    },
  },
  header: {
    marginBottom: theme.spacing(1),
    background: (config) => config && config.appBarColor === 'dark' ?
      theme.palette.dark : theme.palette.light,
    color: (config) => config && config.appBarColor === 'dark' ?
      theme.palette.light : theme.palette.dark
  },
  svgContainer: {
    '& svg': {maxHeight: '3rem'}
  }
}));

export default function Header() {
  const [config, setConfig] = React.useState(null);
  const projectLogo = _.isEmpty(nebraskaLogo) ? null : nebraskaLogo;

  const [menuAnchorEl, setMenuAnchorEl] = React.useState(null);
  const [cachedConfig, setCachedConfig] = React.useState(JSON.parse(localStorage.getItem('nebraska_config')));
  const classes = useStyles(cachedConfig);

  function handleMenu(event) {
    setMenuAnchorEl(event.currentTarget);
  }

  function handleClose() {
    setMenuAnchorEl(null);
  }

  // @todo: This should be abstracted but we should do it when we integrate Redux.
  React.useEffect(() => {
    if (!config) {
      API.getConfig()
        .then(config => {
          const cacheConfig = {
            title: config.title,
            logo: config.logo,
            appBarColor: config.header_style
          };
          localStorage.setItem('nebraska_config', JSON.stringify(cacheConfig));
          setCachedConfig(cacheConfig);
          setConfig(config);
        })
        .catch(error => {
          console.error(error);
        });
    }
  },
  [config]);
  return (
    <AppBar position='static' className={classes.header}>
      <Toolbar>
        {cachedConfig && cachedConfig.logo ?
          <Box className={classes.svgContainer}>
            <div dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(cachedConfig.logo)}}/>
          </Box> :
          <Icon icon={projectLogo} height={45} />
        }
        {cachedConfig && cachedConfig.title !== '' &&
          <Typography variant='h6' className={classes.title}>
            {cachedConfig.title}
          </Typography>
        }

        {config && config.access_management_url &&
          <IconButton
            aria-label='User menu'
            aria-controls='menu-appbar'
            aria-haspopup='true'
            onClick={handleMenu}
            color='inherit'
          >
            <AccountCircle />
          </IconButton>
        }
        <Menu
          id='customized-menu'
          anchorEl={menuAnchorEl}
          open={Boolean(menuAnchorEl)}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <MenuItem
            component="a"
            href={config && config.access_management_url}
          >
            <ListItemIcon>
              <CreateOutlined />
            </ListItemIcon>
            <ListItemText
              primary="Manage Access"
            />
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
