import { Box, Divider } from '@material-ui/core';
import Link from '@material-ui/core/Link';
import { makeStyles } from '@material-ui/core/styles';
import LayersOutlinedIcon from '@material-ui/icons/LayersOutlined';
import PropTypes from 'prop-types';
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import API from '../../api/API';
import ChannelItem from '../Channels/Item.react';

const useStyles = makeStyles(({
  groupLink: {
    fontSize: '1rem'
  },
}));

function ApplicationItemGroupItem(props) {
  const classes = useStyles();
  const {group} = props;
  const [totalInstances, setTotalInstances] = React.useState(-1);

  React.useEffect(() => {
    // We use this function without any filter to get the total number of instances
    // in the group.
    API.getInstancesCount(group.application_id, group.id, '1d')
      .then(result => {
        setTotalInstances(result);
      })
      .catch(err => console.error('Error loading total instances in Instances/List', err));
  },
  [group]);

  const instanceCountContent = (<Box display="flex">
    <LayersOutlinedIcon/>
    <Box px={0.5}>
      {totalInstances}
    </Box>
    {'instances'}
  </Box>);

  return (
    <>
      <Box display="flex" p={1}>
        <Box width="40%">
          <Link
            className={classes.groupLink}
            to={{pathname: `/apps/${props.group.application_id}/groups/${props.group.id}`}}
            component={RouterLink}
          >
            {props.group.name}
          </Link>
        </Box>
        <Box display="flex" width="50%">
          {totalInstances > 0 ?
            <Link
              to={{pathname: `/apps/${props.group.application_id}/groups/${props.group.id}/instances`, search: 'period=1d'}}
              component={RouterLink}
            >
              {instanceCountContent}
            </Link> : instanceCountContent}
        </Box>
      </Box>
      <ChannelItem channel={group.channel} isAppView/>
    </>
  );
}

ApplicationItemGroupItem.propTypes = {
  group: PropTypes.object.isRequired,
  appName: PropTypes.string.isRequired
};

export default ApplicationItemGroupItem;
