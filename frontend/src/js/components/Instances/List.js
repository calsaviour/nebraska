import { makeStyles, Typography } from '@material-ui/core';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import Grid from '@material-ui/core/Grid';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Paper from '@material-ui/core/Paper';
import Select from '@material-ui/core/Select';
import TablePagination from '@material-ui/core/TablePagination';
import { useTheme } from '@material-ui/styles';
import PropTypes from 'prop-types';
import React from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import API from '../../api/API';
import { getInstanceStatus, useGroupVersionBreakdown } from '../../constants/helpers';
import Empty from '../Common/EmptyContent';
import ListHeader from '../Common/ListHeader';
import Loader from '../Common/Loader';
import { InstanceCountLabel } from './Common';
import makeStatusDefs from './StatusDefs';
import Table from './Table';

const useStyles = makeStyles(theme => ({
  root: {
    backgroundColor: theme.palette.lightSilverShade
  }
}));

function InstanceFilter(props) {
  const statusDefs = makeStatusDefs(useTheme());
  const {onFiltersChanged, versions} = props;

  function changeFilter(filterName, filterValue) {
    if (filterValue === props.filter[filterName]) {
      return;
    }

    const filter = {...props.filter};
    filter[filterName] = filterValue;

    onFiltersChanged(filter);
  }

  return (
    <Box pr={2}>
      <Grid container spacing={2} justify="flex-end">
        <Grid item xs={5}>
          <FormControl
            fullWidth
            disabled={props.disabled}
          >
            <InputLabel htmlFor="select-status" shrink>Filter Status</InputLabel>
            <Select
              onChange={event => changeFilter('status', event.target.value) }
              input={<Input id="select-status" />}
              renderValue={selected =>
                selected ? statusDefs[selected].label : 'Show All'
              }
              value={props.filter.status}
              displayEmpty
            >
              <MenuItem key="" value="">Show All</MenuItem>
              {
                Object.keys(statusDefs).map(statusType => {
                  const label = statusDefs[statusType].label;
                  return <MenuItem key={statusType} value={statusType}>{label}</MenuItem>;
                })
              }
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={5}>
          <FormControl
            fullWidth
            disabled={props.disabled}
          >
            <InputLabel htmlFor="select-versions" shrink>Filter Version</InputLabel>
            <Select
              onChange={event => changeFilter('version', event.target.value) }
              input={<Input id="select-versions" />}
              renderValue={selected =>
                selected ? selected : 'Show All'
              }
              value={props.filter.version}
              displayEmpty
            >
              <MenuItem key="" value="">Show All</MenuItem>
              {
                (versions || []).map(({version}) => {
                  return <MenuItem key={version} value={version}>{version}</MenuItem>;
                })
              }
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  );
}

function ListView(props) {
  const classes = useStyles();
  const theme = useTheme();
  const statusDefs = makeStatusDefs(useTheme());
  const {application, group} = props;
  const [page, setPage] = React.useState(0);
  const versionBreakdown = useGroupVersionBreakdown(group);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [instancesObj, setInstancesObj] = React.useState({instances: [], total: -1});
  const [instanceFetchLoading, setInstanceFetchLoading] = React.useState(false);
  const [filters, setFilters] = React.useState({status: '', version: ''});
  const [totalInstances, setTotalInstances] = React.useState(-1);
  const location = useLocation();
  const history = useHistory();

  function fetchFiltersFromURL() {
    let status = '';
    const queryParams = new URLSearchParams(location.search);
    if (queryParams.has('status')) {
      const statusValue = queryParams.get('status');
      if (statusValue !== 'ShowAll') {
        for (const key in statusDefs) {
          if (statusDefs[key].label === statusValue) {
            status = key;
            break;
          }
        }
      }
    }
    const version = queryParams.get('version') || '';
    const pageQueryParam = (parseInt(queryParams.get('page')) || 1) - 1;
    const perPage = parseInt(queryParams.get('perPage')) || 10;
    setFilters({status, version});
    setPage(pageQueryParam);
    setRowsPerPage(perPage);
  }

  function addQuery(queryObj) {
    const pathname = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    for (const key in queryObj) {
      const value = queryObj[key];
      if (value) {
        searchParams.set(key, value);
      } else {
        searchParams.delete(key);
      }
    }

    history.push({
      pathname: pathname,
      search: searchParams.toString()
    });
  };

  function fetchInstances(filters, page, perPage, duration) {
    setInstanceFetchLoading(true);
    const fetchFilters = {...filters};
    if (filters.status === '') {
      fetchFilters.status = '0';
    } else {
      const statusDefinition = statusDefs[fetchFilters.status];
      fetchFilters.status = statusDefinition
        .queryValue;
    }
    API.getInstances(application.id, group.id,
      {
        ...fetchFilters,
        page: page + 1,
        perpage: perPage,
        duration
      }).then((result) => {
      setInstanceFetchLoading(false);
      // Since we have retrieved the instances without a filter (i.e. all instances)
      // we update the total.
      if (!fetchFilters.status && !fetchFilters.version) {
        setTotalInstances(result.total);
      }
      if (result.instances) {
        const massagedInstances = result.instances.map((instance) => {
          instance.statusInfo = getInstanceStatus(instance.application.status,
              instance.application.version);
          return instance;
        });
        setInstancesObj({instances: massagedInstances, total: result.total});
      } else {
        setInstancesObj({instances: [], total: result.total});
      }
    })
      .catch(() => {
        setInstanceFetchLoading(false);
      });
  }

  function handleChangePage(event, newPage) {
    addQuery({ page: newPage + 1 });
  }

  function handleChangeRowsPerPage(event) {
    addQuery({ page: 1, perPage: +event.target.value });
  }

  function onFiltersChanged(newFilters) {
    applyFilters(newFilters);
  }

  function applyFilters(_filters = {}) {
    const newFilters = Object.keys(_filters).length !== 0 ?
      _filters : {status: '', version: ''};
    const statusQueryParam = newFilters.status ? statusDefs[newFilters.status].label : '';
    addQuery({ status: statusQueryParam, version: newFilters.version });
    setFilters(newFilters);
  }

  function resetFilters() {
    applyFilters();
  }

  React.useEffect(() => {
    fetchFiltersFromURL();
  }, [location]);

  React.useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const duration = queryParams.get('period');
    fetchInstances(filters, page, rowsPerPage, duration);
  },
  [filters, page, rowsPerPage]);

  React.useEffect(() => {
    // We only want to run it once ATM.
    if (totalInstances > 0) {
      return;
    }

    // We use this function without any filter to get the total number of instances
    // in the group.
    const queryParams = new URLSearchParams(window.location.search);
    const duration = queryParams.get('period');
    API.getInstancesCount(application.id, group.id, duration)
      .then(result => {
        setTotalInstances(result);
      })
      .catch(err => console.error('Error loading total instances in Instances/List', err));
  },
  [totalInstances]);

  function getInstanceCount() {
    const total = totalInstances > -1 ? totalInstances : '…';
    const instancesTotal = instancesObj.total > -1 ? instancesObj.total : '...';
    if (!filters.status && !filters.version || instancesTotal === total) {
      return total;
    }
    return `${instancesTotal}/${total}`;
  }

  function isFiltered() {
    return filters.status || filters.version;
  }
  return (
    <>
      <ListHeader
        title="Instance List"
      />
      <Paper>
        <Box padding="1em">
          <Grid
            container
            spacing={1}
          >
            <Grid item md={12}>
              <Box mb={2} color={theme.palette.greyShadeColor} fontSize={30} fontWeight={700}>
                {group.name}
              </Box>
            </Grid>
            <Box width="100%" borderTop={1} borderColor={'#E0E0E0'} className={classes.root}>
              <Grid
                item
                container
                md={12}
                alignItems="stretch"
                justify="space-between"
              >
                <Grid item md>
                  <Box ml={2}>
                    <InstanceCountLabel
                      countText={getInstanceCount()}
                      instanceListView
                    />
                  </Box>
                </Grid>
                <Grid item md>
                  <Box mt={2}>
                    <InstanceFilter
                      versions={versionBreakdown}
                      onFiltersChanged={onFiltersChanged}
                      filter={filters}
                    />
                  </Box>
                </Grid>
              </Grid>
            </Box>
            {isFiltered() &&
            <Grid item md={12} container justify="center">
              <Grid item>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={resetFilters}
                >
                  Reset filters
                </Button>
              </Grid>
            </Grid>
            }
            <Grid item md={12}>
              {!instanceFetchLoading ?
                (instancesObj.instances.length > 0 ?
                  <React.Fragment>
                    <Table
                      group={group}
                      channel={group.channel}
                      instances={instancesObj.instances}
                    />
                    <TablePagination
                      rowsPerPageOptions={[10, 25, 50, 100]}
                      component="div"
                      count={instancesObj.total}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      backIconButtonProps={{
                        'aria-label': 'previous page',
                      }}
                      nextIconButtonProps={{
                        'aria-label': 'next page',
                      }}
                      onChangePage={handleChangePage}
                      onChangeRowsPerPage={handleChangeRowsPerPage}
                    />
                  </React.Fragment>
                  :
                  <Empty>No instances.</Empty>
                )
                :
                  <Loader />
              }
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </>
  );
}

ListView.propTypes = {
  application: PropTypes.object.isRequired,
  group: PropTypes.object.isRequired,
};

export default ListView;
